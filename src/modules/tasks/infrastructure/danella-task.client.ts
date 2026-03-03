import axios, { AxiosError, type AxiosInstance } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/domain/app-error";
import {
  type AddTaskProjectCodeInput,
  type AddTaskProjectCodeResult,
  type DeleteTaskProjectCodeInput,
  type DeleteTaskProjectCodeResult,
  type GetAvailableTaskProjectCodesInput,
  type GetAvailableTaskProjectCodesResult,
  type GetTaskAttachmentsInput,
  type GetTaskAttachmentsResult,
  type GetTaskDeploymentInput,
  type GetTaskDeploymentResult,
  type GetTaskProjectCodeDetailInput,
  type GetTaskProjectCodeDetailResult,
  type ListTasksInput,
  type ListTasksResult,
  type TaskRepository,
  type UpstreamTask,
} from "../domain";

const toAbsoluteUrl = (baseUrl: string, maybeRelativePath: string): string => {
  if (/^https?:\/\//i.test(maybeRelativePath)) {
    return maybeRelativePath;
  }

  return new URL(maybeRelativePath, baseUrl).toString();
};

const isLoginHtml = (html: string): boolean => {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("__requestverificationtoken") ||
    normalized.includes("/home/login") ||
    normalized.includes("name=\"username\"")
  );
};

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

const extractConstArray = (html: string, name: string): Record<string, unknown>[] => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`const\\s+${escapedName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const match = html.match(regex);

  if (!match?.[1]) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    throw new AppError(502, "UPSTREAM_PARSE_ERROR", `Could not parse ${name} payload from upstream HTML`);
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

export class DanellaTaskClient implements TaskRepository {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.danella.baseUrl,
      timeout: env.danella.timeoutMs,
    });
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

      const redirectedToLogin =
        response.status >= 300 &&
        response.status < 400 &&
        typeof response.headers.location === "string" &&
        response.headers.location.toLowerCase().includes("/home/login");

      if (redirectedToLogin || isLoginHtml(response.data)) {
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
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream tasks endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while requesting upstream tasks");
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

      const redirectedToLogin =
        response.status >= 300 &&
        response.status < 400 &&
        typeof response.headers.location === "string" &&
        response.headers.location.toLowerCase().includes("/home/login");

      if (redirectedToLogin || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      return {
        taskId: input.taskId,
        portfolioList: extractConstArray(response.data, "portfolioList"),
        assignedProjectCodes: extractConstArray(response.data, "assigned"),
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream deployment endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while requesting deployment detail");
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

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (!Array.isArray(response.data)) {
        throw new AppError(502, "UPSTREAM_PARSE_ERROR", "Unexpected attachments response format from upstream");
      }

      return {
        taskId: input.taskId,
        attachments: response.data as Record<string, unknown>[],
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream attachments endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while requesting task attachments");
    }
  }

  async getAvailableTaskProjectCodes(
    input: GetAvailableTaskProjectCodesInput,
  ): Promise<GetAvailableTaskProjectCodesResult> {
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
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          "Could not reach upstream available project codes endpoint",
        );
      }

      const redirectedToLogin =
        response.status >= 300 &&
        response.status < 400 &&
        typeof response.headers.location === "string" &&
        response.headers.location.toLowerCase().includes("/home/login");

      if (redirectedToLogin || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      return {
        taskId: input.taskId,
        projectCodes: extractConstArray(response.data, "portfolioList"),
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream available project codes endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(
        503,
        "UPSTREAM_UNAVAILABLE",
        "Unknown error while requesting available task project codes",
      );
    }
  }

  async getTaskProjectCodeDetail(
    input: GetTaskProjectCodeDetailInput,
  ): Promise<GetTaskProjectCodeDetailResult> {
    const url = toAbsoluteUrl(
      env.danella.baseUrl,
      `/Task/GetPortfolioByID?portfolioID=${encodeURIComponent(String(input.portfolioId))}`,
    );

    try {
      const response = await this.http.get<unknown>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          "Could not reach upstream project code detail endpoint",
        );
      }

      const redirectedToLogin =
        response.status >= 300 &&
        response.status < 400 &&
        typeof response.headers.location === "string" &&
        response.headers.location.toLowerCase().includes("/home/login");

      if (redirectedToLogin) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data !== "object" || response.data === null || Array.isArray(response.data)) {
        throw new AppError(
          502,
          "UPSTREAM_PARSE_ERROR",
          "Unexpected project code detail response format from upstream",
        );
      }

      return {
        portfolioId: input.portfolioId,
        detail: response.data as Record<string, unknown>,
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream project code detail endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(
        503,
        "UPSTREAM_UNAVAILABLE",
        "Unknown error while requesting task project code detail",
      );
    }
  }

  async addTaskProjectCode(input: AddTaskProjectCodeInput): Promise<AddTaskProjectCodeResult> {
    const url = toAbsoluteUrl(env.danella.baseUrl, "/Task/AddPortfolioToTask");

    try {
      const response = await this.http.post<unknown>(
        url,
        {
          taskID: String(input.taskId),
          portfolioID: String(input.portfolioId),
          quantity: input.quantity,
          footage: input.footage,
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
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream add project code endpoint");
      }

      const redirectedToLogin =
        response.status >= 300 &&
        response.status < 400 &&
        typeof response.headers.location === "string" &&
        response.headers.location.toLowerCase().includes("/home/login");

      if (redirectedToLogin) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const payload = typeof response.data === "object" && response.data !== null ? response.data : {};
      const success =
        typeof (payload as { success?: unknown }).success === "boolean"
          ? Boolean((payload as { success?: boolean }).success)
          : response.status >= 200 && response.status < 300;

      return {
        success,
        message:
          typeof (payload as { message?: unknown }).message === "string"
            ? ((payload as { message?: string }).message ?? undefined)
            : undefined,
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream add project code endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while adding task project code");
    }
  }

  async deleteTaskProjectCode(input: DeleteTaskProjectCodeInput): Promise<DeleteTaskProjectCodeResult> {
    const url = toAbsoluteUrl(env.danella.baseUrl, "/Task/DeleteTaskProjectCode");

    try {
      const response = await this.http.post<unknown>(
        url,
        { taskProjectCodeID: input.taskProjectCodeId },
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
        throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Could not reach upstream project code delete endpoint");
      }

      if (typeof response.data === "string" && isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      const payload = typeof response.data === "object" && response.data !== null ? response.data : {};
      const success =
        typeof (payload as { success?: unknown }).success === "boolean"
          ? Boolean((payload as { success?: boolean }).success)
          : response.status >= 200 && response.status < 300;

      return {
        success,
        message:
          typeof (payload as { message?: unknown }).message === "string"
            ? ((payload as { message?: string }).message ?? undefined)
            : undefined,
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw new AppError(
          503,
          "UPSTREAM_UNAVAILABLE",
          `Could not reach upstream project code delete endpoint: ${error.code ?? error.message}`,
        );
      }

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while deleting task project code");
    }
  }
}
