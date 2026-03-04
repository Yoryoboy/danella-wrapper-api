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
  type GetTaskDeploymentInput,
  type GetTaskDeploymentResult,
  type GetTaskFormMetadataInput,
  type GetTaskFormMetadataResult,
  type ListTasksInput,
  type ListTasksResult,
  type TaskAssignedProjectCode,
  type TaskAttachment,
  type TaskMetadataDictionaryItem,
  type TaskMetadataJobTypeDictionaryItem,
  type TaskPortfolioCode,
  type TaskRepository,
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

  async getDeployment(input: GetTaskDeploymentInput): Promise<GetTaskDeploymentResult> {
    const url = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/DeploymentProject?TaskID=${encodeURIComponent(String(input.taskId))}`,
    );

    try {
      const response = await this.http.get<string>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream deployment endpoint");
      }

      if (isRedirectedToLogin(response) || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      return {
        taskId: input.taskId,
        portfolioList: extractConstArray<TaskPortfolioCode>(response.data, "portfolioList"),
        assignedProjectCodes: extractConstArray<TaskAssignedProjectCode>(response.data, "assigned"),
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream deployment endpoint" });
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
