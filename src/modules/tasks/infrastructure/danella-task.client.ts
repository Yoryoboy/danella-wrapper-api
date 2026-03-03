import axios, { AxiosError, type AxiosInstance } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/domain/app-error";
import { type TaskRepository, type ListTasksInput, type ListTasksResult, type UpstreamTask } from "../domain";

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
}
