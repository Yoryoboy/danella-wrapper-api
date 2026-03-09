import type { AxiosInstance } from "axios";
import * as cheerio from "cheerio";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/domain/app-error";
import { createDanellaHttpClient } from "../../../shared/infrastructure/danella-http.client";
import { extractConstArray, isLoginHtml } from "../../../shared/infrastructure/html.utils";
import { isRedirectedToLogin } from "../../../shared/infrastructure/response.utils";
import { toUpstreamAppError } from "../../../shared/infrastructure/upstream-error.utils";
import { toAbsoluteUrl } from "../../../shared/infrastructure/url.utils";
import {
  type CreateTaskInput,
  type CreateTaskResult,
  type GetTaskAttachmentsInput,
  type GetTaskAttachmentsResult,
  type GetProjectSecondaryFieldsInput,
  type GetProjectSecondaryFieldsResult,
  type GetTaskDetailInput,
  type GetTaskDetailResult,
  type GetTaskFormMetadataInput,
  type GetTaskFormMetadataResult,
  type ListTasksInput,
  type ListTasksResult,
  type ProjectSecondaryField,
  type UpdateTaskSecondaryFieldsUpstreamInput,
  type UpdateTaskSecondaryFieldsUpstreamResult,
  type TaskAssignmentControl,
  type TaskAssignmentRow,
  type TaskAssignedProjectCode,
  type TaskAttachment,
  type TaskMessage,
  type TaskMetadataDictionaryItem,
  type TaskMetadataJobTypeDictionaryItem,
  type TaskPrimaryDetails,
  type TaskPortfolioCode,
  type TaskRepository,
  type TaskSecondaryField,
  type TaskVendorAssignment,
  type UpstreamTask,
} from "../domain";

const extractTasksData = (html: string): UpstreamTask[] => {
  const match = html.match(/var\s+tasksData\s*=\s*(\[[\s\S]*?\]);/);
  if (!match?.[1]) {
    throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Could not extract tasksData from upstream HTML");
  }

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("tasksData is not an array");
    }
    return parsed as UpstreamTask[];
  } catch {
    throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Could not parse tasksData payload from upstream HTML");
  }
};

const applyFilters = (items: UpstreamTask[], status?: string, search?: string): UpstreamTask[] => {
  return items.filter((item) => {
    const statusOk = status
      ? String(item.taskStatusName ?? "")
          .toLowerCase()
          .includes(status.toLowerCase())
      : true;

    const searchOk = search
      ? [
          String(item.taskCode ?? ""),
          String(item.jobID ?? ""),
          String(item.endCustomerName ?? ""),
          String(item.vendorName ?? ""),
          String(item.customerName ?? ""),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      : true;

    return statusOk && searchOk;
  });
};

type UpstreamJobType = {
  jobTypeID?: number;
  projectTypeID?: number;
  jobType?: string;
  [key: string]: unknown;
};

const toPositiveInt = (value: unknown): number | null => {
  const parsed = Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toDictionaryItem = (id: number, name: string): TaskMetadataDictionaryItem => ({
  id,
  name,
  code: null,
});

const normalizeLabelText = (value: string): string => value.replace(/\s+/g, " ").trim();

const extractLabelValue = ($: cheerio.CheerioAPI, labelPrefix: string): string | null => {
  const normalizedPrefix = `${labelPrefix.toLowerCase()}:`;

  for (const node of $("#addTaskForm label").toArray()) {
    const rawText = normalizeLabelText($(node).text());
    if (!rawText.toLowerCase().startsWith(normalizedPrefix)) {
      continue;
    }

    const value = rawText.slice(rawText.indexOf(":") + 1).trim();
    return value || null;
  }

  return null;
};

const extractHiddenId = ($: cheerio.CheerioAPI, selector: string, field: string): number => {
  const rawValue = $(selector).attr("value") ?? $(selector).val();
  const parsed = toPositiveInt(rawValue);

  if (!parsed) {
    throw new AppError(502, "UPSTREAM_PARSE_ERROR", `Could not extract ${field} from upstream HTML`);
  }

  return parsed;
};

const extractSelectDictionary = ($: cheerio.CheerioAPI, selector: string): TaskMetadataDictionaryItem[] => {
  const entries: TaskMetadataDictionaryItem[] = [];

  $(selector)
    .find("option")
    .each((_idx, option) => {
      const rawId = $(option).attr("value");
      const id = toPositiveInt(rawId);
      const name = normalizeLabelText($(option).text());

      if (!id || !name) {
        return;
      }

      entries.push(toDictionaryItem(id, name));
    });

  return entries;
};

const hasDictionaryEntry = (entries: TaskMetadataDictionaryItem[], id: number): boolean =>
  entries.some((entry) => entry.id === id);

type LabelValuePair = {
  label: string;
  value: string | null;
};

const normalizeCellValue = (value: string): string | null => {
  const normalized = normalizeLabelText(value);
  return normalized.length > 0 ? normalized : null;
};

const extractLabelValuePairs = ($: cheerio.CheerioAPI, tableSelector: string): LabelValuePair[] => {
  const pairs: LabelValuePair[] = [];

  $(`${tableSelector} tr`).each((_idx, row) => {
    const cells = $(row).find("th, td").toArray();
    if (cells.length < 2) {
      return;
    }

    for (let index = 0; index + 1 < cells.length; index += 2) {
      const label = normalizeCellValue($(cells[index]).text());
      if (!label) {
        continue;
      }

      const value = normalizeCellValue($(cells[index + 1]).text());
      pairs.push({ label, value });
    }
  });

  return pairs;
};

const getFirstMappedValue = (pairs: LabelValuePair[], label: string): string | null => {
  const item = pairs.find((pair) => pair.label.toLowerCase() === label.toLowerCase());
  return item ? item.value : null;
};

const extractTaskIdFromHref = (href: string | undefined): number | null => {
  if (!href) {
    return null;
  }

  const match = href.match(/[?&]TaskID=(\d+)/i);
  if (!match?.[1]) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const extractPrimaryJobLinks = ($: cheerio.CheerioAPI): { label: string; taskId: number | null; href: string | null }[] => {
  const jobLinks: { label: string; taskId: number | null; href: string | null }[] = [];

  $("#tablaTaskDetail tr").each((_idx, row) => {
    const cells = $(row).find("th, td").toArray();
    if (cells.length < 2) {
      return;
    }

    const firstCell = normalizeCellValue($(cells[0]).text());
    if (firstCell?.toLowerCase() !== "job id") {
      return;
    }

    $(cells[1])
      .find("a")
      .each((_anchorIdx, anchor) => {
        const label = normalizeCellValue($(anchor).text());
        if (!label) {
          return;
        }

        const href = $(anchor).attr("href") ?? null;
        jobLinks.push({
          label,
          taskId: extractTaskIdFromHref(href ?? undefined),
          href,
        });
      });
  });

  return jobLinks;
};

const buildPrimaryDetails = ($: cheerio.CheerioAPI): TaskPrimaryDetails => {
  const pairs = extractLabelValuePairs($, "#tablaTaskDetail");
  const knownLabels = new Set([
    "Sub-Project Identifier - (Task ID)",
    "Creation Date",
    "Job ID",
    "Star Date",
    "Start Date",
    "Customer (BU)",
    "Estimated Closing Date",
    "End Customer",
    "End Date",
    "Legal Entity",
    "Manager Area",
    "Frecast Revenue Amount",
    "Forecast Revenue Amount",
    "Frecast Cost Amount",
    "Forecast Cost Amount",
    "Project Type",
    "Job Type",
  ]);

  const extra = pairs.reduce<Record<string, string | null>>((acc, pair) => {
    if (knownLabels.has(pair.label)) {
      return acc;
    }

    acc[pair.label] = pair.value;
    return acc;
  }, {});

  return {
    taskCode: getFirstMappedValue(pairs, "Sub-Project Identifier - (Task ID)"),
    creationDate: getFirstMappedValue(pairs, "Creation Date"),
    jobId: getFirstMappedValue(pairs, "Job ID"),
    jobLinks: extractPrimaryJobLinks($),
    startDate: getFirstMappedValue(pairs, "Star Date") ?? getFirstMappedValue(pairs, "Start Date"),
    customerBu: getFirstMappedValue(pairs, "Customer (BU)"),
    estimatedClosingDate: getFirstMappedValue(pairs, "Estimated Closing Date"),
    endCustomer: getFirstMappedValue(pairs, "End Customer"),
    endDate: getFirstMappedValue(pairs, "End Date"),
    legalEntity: getFirstMappedValue(pairs, "Legal Entity"),
    managerArea: getFirstMappedValue(pairs, "Manager Area"),
    forecastRevenueAmount:
      getFirstMappedValue(pairs, "Frecast Revenue Amount") ??
      getFirstMappedValue(pairs, "Forecast Revenue Amount"),
    forecastCostAmount:
      getFirstMappedValue(pairs, "Frecast Cost Amount") ?? getFirstMappedValue(pairs, "Forecast Cost Amount"),
    projectType: getFirstMappedValue(pairs, "Project Type"),
    jobType: getFirstMappedValue(pairs, "Job Type"),
    extra,
  };
};

const extractSecondaryFieldIds = ($: cheerio.CheerioAPI): Array<number | null> => {
  const ids: Array<number | null> = [];

  $("input[type='hidden'][name$='.TaskSecondaryFieldID']").each((_idx, input) => {
    const rawValue = $(input).attr("value") ?? $(input).val();
    ids.push(toPositiveInt(rawValue));
  });

  return ids;
};

const buildSecondaryFields = ($: cheerio.CheerioAPI): TaskSecondaryField[] => {
  const pairs = extractLabelValuePairs($, "#tablaSecondaryFields");
  const fieldIds = extractSecondaryFieldIds($);

  return pairs.map((pair, index) => ({
    taskSecondaryFieldId: fieldIds[index] ?? null,
    label: pair.label,
    value: pair.value,
  }));
};

const buildProjectSecondaryFields = ($: cheerio.CheerioAPI): ProjectSecondaryField[] => {
  return $("#tablaSecondaryFields tbody tr")
    .toArray()
    .reduce<ProjectSecondaryField[]>((acc, row) => {
      const cells = $(row).find("td").toArray();
      const label = cells[0] ? normalizeCellValue($(cells[0]).text()) : null;
      const button = cells[1] ? $(cells[1]).find("button[onclick*='deleteSecondaryField(']").first() : null;
      const onclick = button?.attr("onclick") ?? "";
      const match = onclick.match(/deleteSecondaryField\((\d+)\)/i);
      const projectSecondaryFieldId = match?.[1] ? Number(match[1]) : null;

      if (!label) {
        return acc;
      }

      acc.push({
        projectSecondaryFieldId: Number.isInteger(projectSecondaryFieldId) ? projectSecondaryFieldId : null,
        label,
      });

      return acc;
    }, []);
};

const extractVendorSummary = ($: cheerio.CheerioAPI): string | null => {
  const text = normalizeLabelText($("main").text());
  const match = text.match(/\d+\s*pv\s*\|\s*Supplier/i);
  return match?.[0] ?? null;
};

const extractVendorAssignments = ($: cheerio.CheerioAPI): TaskVendorAssignment[] => {
  const assignments: TaskVendorAssignment[] = [];

  $("div.card.border.rounded.shadow-sm.small").each((_idx, card) => {
    const cardPairs: LabelValuePair[] = [];

    $(card)
      .find("p")
      .each((_pairIdx, paragraph) => {
        const labelNode = $(paragraph).find("strong").first();
        if (!labelNode.length) {
          return;
        }

        const label = normalizeCellValue(labelNode.text());
        if (!label) {
          return;
        }

        const value = normalizeCellValue(
          $(paragraph)
            .clone()
            .find("strong")
            .remove()
            .end()
            .text(),
        );
        cardPairs.push({ label, value });
      });

    if (cardPairs.length === 0) {
      return;
    }

    const firstPair = cardPairs[0];
    const getValue = (label: string): string | null => {
      const item = cardPairs.find((pair) => pair.label.toLowerCase() === label.toLowerCase());
      return item ? item.value : null;
    };

    const reserved = new Set(["Role", "Total Hrs. Assignment", "Start Date", "End Date"]);
    const extra = cardPairs.reduce<Record<string, string | null>>((acc, pair, index) => {
      if (index === 0 || reserved.has(pair.label)) {
        return acc;
      }

      acc[pair.label] = pair.value;
      return acc;
    }, {});

    assignments.push({
      title: firstPair.label,
      resourceName: firstPair.value,
      role: getValue("Role"),
      totalHours: getValue("Total Hrs. Assignment"),
      startDate: getValue("Start Date"),
      endDate: getValue("End Date"),
      extra,
    });
  });

  return assignments;
};

const buildAssignmentControl = ($: cheerio.CheerioAPI): TaskAssignmentControl => {
  const headers = $("#tablaAssignment thead th")
    .toArray()
    .map((header) => normalizeCellValue($(header).text()))
    .filter((value): value is string => Boolean(value));

  const rows: TaskAssignmentRow[] = [];

  $("#tablaAssignment tbody tr").each((_idx, row) => {
    const cells = $(row).find("td").toArray();
    if (cells.length === 0) {
      return;
    }

    const resource = normalizeCellValue($(cells[0]).text());
    const positionTitle = normalizeCellValue($(cells[1]).text());
    const dayValues = headers.slice(2).reduce<Record<string, string | null>>((acc, label, dayIndex) => {
      const cellValue = cells[dayIndex + 2] ? normalizeCellValue($(cells[dayIndex + 2]).text()) : null;
      acc[label] = cellValue;
      return acc;
    }, {});

    rows.push({
      resource,
      positionTitle,
      dayValues,
    });
  });

  return {
    headers,
    inHouseRows: rows,
    vendorSummary: extractVendorSummary($),
    vendorAssignments: extractVendorAssignments($),
  };
};

const normalizeMessages = (data: unknown): TaskMessage[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data as TaskMessage[];
};

export class DanellaTaskClient implements TaskRepository {
  private readonly http: AxiosInstance;

  constructor(http?: AxiosInstance) {
    this.http = http ?? createDanellaHttpClient();
  }

  async listBySubProject(input: ListTasksInput): Promise<ListTasksResult> {
    const url = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/TaskSubProject?SubProjectID=${encodeURIComponent(String(input.subProjectId))}`,
    );

    try {
      const response = await this.http.get<string>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream tasks endpoint");
      }

      if (isRedirectedToLogin(response) || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const allItems = extractTasksData(response.data);
      const filteredItems = applyFilters(allItems, input.status, input.search);
      const total = filteredItems.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / input.limit);
      const start = (input.page - 1) * input.limit;
      const items = filteredItems.slice(start, start + input.limit);

      return {
        items,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages,
        },
        filters: {
          subProjectId: input.subProjectId,
          status: input.status,
          search: input.search,
        },
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream tasks endpoint" });
    }
  }

  async getTaskFormMetadata(input: GetTaskFormMetadataInput): Promise<GetTaskFormMetadataResult> {
    const url = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/TaskSubProject?SubProjectID=${encodeURIComponent(String(input.subProjectId))}`,
    );

    try {
      const response = await this.http.get<string>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream task form metadata endpoint");
      }

      if (isRedirectedToLogin(response) || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const $ = cheerio.load(response.data);
      const customerId = extractHiddenId($, "#customerID", "customerID");
      const projectId = extractHiddenId($, "#projectID", "projectID");
      const subProjectId = extractHiddenId($, "#subProjectID", "subProjectID");
      const projectTypeId = extractHiddenId($, "#newProjectTypeID", "projectTypeID");
      const jobTypeDefaultId = extractHiddenId($, "#newJobTypeID", "jobTypeID");

      const customerName = extractLabelValue($, "Customer");
      const projectName = extractLabelValue($, "Project");
      const subProjectName = extractLabelValue($, "SubProject");
      const projectTypeName = extractLabelValue($, "Project Type");
      const jobTypeDefaultName = extractLabelValue($, "Job Type");

      if (!customerName || !projectName || !subProjectName || !projectTypeName || !jobTypeDefaultName) {
        throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Could not extract task form labels from upstream HTML");
      }

      const endCustomers = extractSelectDictionary($, "#newEndCustomerID");
      const managerAreas = extractSelectDictionary($, "#newManagerAreaID");

      const jobTypesUrl = toAbsoluteUrl(
        env.danella.baseUrl,
        `/Task/GetJobTypesByProjectType?projectTypeID=${encodeURIComponent(String(projectTypeId))}`,
      );
      const jobTypesResponse = await this.http.get<unknown>(jobTypesUrl, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (jobTypesResponse.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream job types endpoint");
      }

      if (isRedirectedToLogin(jobTypesResponse)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof jobTypesResponse.data === "string" && isLoginHtml(jobTypesResponse.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (!Array.isArray(jobTypesResponse.data)) {
        throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Unexpected job types response format from upstream");
      }

      const jobTypesByProjectType = (jobTypesResponse.data as UpstreamJobType[]).reduce<
        TaskMetadataJobTypeDictionaryItem[]
      >((acc, item) => {
        const id = toPositiveInt(item.jobTypeID);
        const name = normalizeLabelText(String(item.jobType ?? ""));
        const itemProjectTypeId = toPositiveInt(item.projectTypeID) ?? projectTypeId;

        if (!id || !name) {
          return acc;
        }

        acc.push({
          id,
          name,
          code: null,
          projectTypeId: itemProjectTypeId,
        });

        return acc;
      }, []);

      return {
        subProject: toDictionaryItem(subProjectId, subProjectName),
        project: toDictionaryItem(projectId, projectName),
        customer: toDictionaryItem(customerId, customerName),
        projectType: toDictionaryItem(projectTypeId, projectTypeName),
        jobTypeDefault: toDictionaryItem(jobTypeDefaultId, jobTypeDefaultName),
        endCustomers,
        managerAreas,
        jobTypesByProjectType,
        upstream: {
          status: response.status,
          url,
          jobTypesStatus: jobTypesResponse.status,
          jobTypesUrl,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream task form metadata endpoint" });
    }
  }

  async getProjectSecondaryFields(input: GetProjectSecondaryFieldsInput): Promise<GetProjectSecondaryFieldsResult> {
    const url = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Projects/SecondaryFields?ProjectID=${encodeURIComponent(String(input.projectId))}`,
    );

    try {
      const response = await this.http.get<string>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream project secondary fields endpoint");
      }

      if (isRedirectedToLogin(response) || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const $ = cheerio.load(response.data);
      const projectHeading = $("main h4")
        .toArray()
        .map((node) => normalizeCellValue($(node).text()))
        .find((value, index, all) => Boolean(value) && index > 0 && value !== all[0]) ?? null;

      return {
        projectId: input.projectId,
        projectName: projectHeading,
        items: buildProjectSecondaryFields($),
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream project secondary fields endpoint" });
    }
  }

  async createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
    const url = toAbsoluteUrl(env.danella.baseUrl, "/Task/InsertTask");

    try {
      const metadata = await this.getTaskFormMetadata({
        cookieHeader: input.cookieHeader,
        subProjectId: input.subProjectId,
      });

      if (!hasDictionaryEntry(metadata.endCustomers, input.endCustomerId)) {
        throw new AppError(400, "VALIDATION_ERROR", "endCustomerId is not valid for this sub-project", {
          subProjectId: input.subProjectId,
          endCustomerId: input.endCustomerId,
        });
      }

      if (!hasDictionaryEntry(metadata.managerAreas, input.managerAreaId)) {
        throw new AppError(400, "VALIDATION_ERROR", "managerAreaId is not valid for this sub-project", {
          subProjectId: input.subProjectId,
          managerAreaId: input.managerAreaId,
        });
      }

      const response = await this.http.post<unknown>(
        url,
        {
          jobID: input.jobId,
          endCustomerID: String(input.endCustomerId),
          managerAreaID: String(input.managerAreaId),
          customerID: String(metadata.customer.id),
          projectID: String(metadata.project.id),
          subProjectID: String(metadata.subProject.id),
          projectTypeID: String(metadata.projectType.id),
          verifierKeyID: input.verifierKeyId,
          jobTypeID: String(metadata.jobTypeDefault.id),
        },
        {
          headers: {
            Cookie: input.cookieHeader,
            "Content-Type": "application/json",
          },
          maxRedirects: 0,
          validateStatus: () => true,
        },
      );

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream task creation endpoint");
      }

      if (isRedirectedToLogin(response)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data !== "object" || response.data === null || Array.isArray(response.data)) {
        throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Unexpected task creation response format from upstream");
      }

      const payload = response.data as { success?: unknown; message?: unknown };
      const success =
        typeof payload.success === "boolean"
          ? payload.success
          : response.status >= 200 && response.status < 300;

      return {
        success,
        message:
          typeof payload.message === "string"
            ? payload.message
            : success
              ? "Created successfully"
              : "Upstream task creation did not succeed",
        data: {
          subProjectId: input.subProjectId,
          jobId: input.jobId,
          verifierKeyId: input.verifierKeyId,
          endCustomerId: input.endCustomerId,
          managerAreaId: input.managerAreaId,
        },
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream task creation endpoint" });
    }
  }

  async updateTaskSecondaryFields(
    input: UpdateTaskSecondaryFieldsUpstreamInput,
  ): Promise<UpdateTaskSecondaryFieldsUpstreamResult> {
    const url = toAbsoluteUrl(env.danella.baseUrl, "/Task/UpdateTaskSecondaryFieldsAjax");

    try {
      const body = new URLSearchParams();
      body.set("TaskID", String(input.taskId));

      for (const field of input.fields) {
        body.append(
          `Fields[${field.taskSecondaryFieldId}].TaskSecondaryFieldID`,
          String(field.taskSecondaryFieldId),
        );
        body.append(`Fields[${field.taskSecondaryFieldId}].Value`, field.value);
      }

      const response = await this.http.post<unknown>(url, body.toString(), {
        headers: {
          Cookie: input.cookieHeader,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream task secondary fields update endpoint");
      }

      if (isRedirectedToLogin(response)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data !== "object" || response.data === null || Array.isArray(response.data)) {
        throw new AppError(
          502,
          "UPSTREAM_PARSE_ERROR",
          "Unexpected task secondary fields update response format from upstream",
        );
      }

      const payload = response.data as { success?: unknown; message?: unknown };
      const success =
        typeof payload.success === "boolean"
          ? payload.success
          : response.status >= 200 && response.status < 300;

      return {
        success,
        message:
          typeof payload.message === "string"
            ? payload.message
            : success
              ? "Secondary fields updated successfully."
              : "Upstream task secondary fields update did not succeed",
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream task secondary fields update endpoint" });
    }
  }

  async getTaskDetail(input: GetTaskDetailInput): Promise<GetTaskDetailResult> {
    const deploymentUrl = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/DeploymentProject?TaskID=${encodeURIComponent(String(input.taskId))}`,
    );
    const attachmentsUrl = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/GetAttachments?taskID=${encodeURIComponent(String(input.taskId))}`,
    );
    const messagesUrl = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/GetMessagesByTaskID?taskID=${encodeURIComponent(String(input.taskId))}`,
    );

    try {
      const deploymentResponse = await this.http.get<string>(deploymentUrl, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (deploymentResponse.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream deployment endpoint");
      }

      if (isRedirectedToLogin(deploymentResponse) || isLoginHtml(deploymentResponse.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const attachmentsResponse = await this.http.get<unknown>(attachmentsUrl, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (attachmentsResponse.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream attachments endpoint");
      }

      if (isRedirectedToLogin(attachmentsResponse)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof attachmentsResponse.data === "string" && isLoginHtml(attachmentsResponse.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (!Array.isArray(attachmentsResponse.data)) {
        throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Unexpected attachments response format from upstream");
      }

      const messagesResponse = await this.http.get<unknown>(messagesUrl, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (messagesResponse.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream messages endpoint");
      }

      if (isRedirectedToLogin(messagesResponse)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof messagesResponse.data === "string" && isLoginHtml(messagesResponse.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const $ = cheerio.load(deploymentResponse.data);

      return {
        taskId: input.taskId,
        primaryDetails: buildPrimaryDetails($),
        secondaryFields: buildSecondaryFields($),
        assignmentControl: buildAssignmentControl($),
        projectCodes: {
          available: extractConstArray<TaskPortfolioCode>(deploymentResponse.data, "portfolioList"),
          assigned: extractConstArray<TaskAssignedProjectCode>(deploymentResponse.data, "assigned"),
        },
        attachments: attachmentsResponse.data as TaskAttachment[],
        messages: normalizeMessages(messagesResponse.data),
        upstream: {
          deployment: {
            status: deploymentResponse.status,
            url: deploymentUrl,
          },
          attachments: {
            status: attachmentsResponse.status,
            url: attachmentsUrl,
          },
          messages: {
            status: messagesResponse.status,
            url: messagesUrl,
          },
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream task detail endpoint" });
    }
  }

  async getAttachments(input: GetTaskAttachmentsInput): Promise<GetTaskAttachmentsResult> {
    const url = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/GetAttachments?taskID=${encodeURIComponent(String(input.taskId))}`,
    );

    try {
      const response = await this.http.get<unknown>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream attachments endpoint");
      }

      if (isRedirectedToLogin(response)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (!Array.isArray(response.data)) {
        throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Unexpected attachments response format from upstream");
      }

      return {
        taskId: input.taskId,
        attachments: response.data as TaskAttachment[],
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream attachments endpoint" });
    }
  }
}
