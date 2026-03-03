import type { AxiosInstance } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/domain/app-error";
import { createDanellaHttpClient } from "../../../shared/infrastructure/danella-http.client";
import { extractConstArray, isLoginHtml } from "../../../shared/infrastructure/html.utils";
import { isRedirectedToLogin } from "../../../shared/infrastructure/response.utils";
import { toUpstreamAppError } from "../../../shared/infrastructure/upstream-error.utils";
import { toAbsoluteUrl } from "../../../shared/infrastructure/url.utils";
import {
  type GetTaskAttachmentsInput,
  type GetTaskAttachmentsResult,
  type GetTaskDeploymentInput,
  type GetTaskDeploymentResult,
  type ListTasksInput,
  type ListTasksResult,
  type TaskAssignedProjectCode,
  type TaskAttachment,
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
