import axios, { AxiosError, type AxiosInstance } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/domain/app-error";
import type {
  AddCodeToTaskInput,
  AddCodeToTaskResult,
  CodeRepository,
  DeleteCodeFromTaskInput,
  DeleteCodeFromTaskResult,
  GetAvailableCodesInput,
  GetAvailableCodesResult,
  GetCodeDetailInput,
  GetCodeDetailResult,
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

export class DanellaCodeClient implements CodeRepository {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.danella.baseUrl,
      timeout: env.danella.timeoutMs,
    });
  }

  async getAvailableCodes(input: GetAvailableCodesInput): Promise<GetAvailableCodesResult> {
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
        codes: extractConstArray(response.data, "portfolioList"),
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

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while requesting available codes");
    }
  }

  async getCodeDetail(input: GetCodeDetailInput): Promise<GetCodeDetailResult> {
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

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while requesting project code detail");
    }
  }

  async addCodeToTask(input: AddCodeToTaskInput): Promise<AddCodeToTaskResult> {
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

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while adding project code");
    }
  }

  async deleteCodeFromTask(input: DeleteCodeFromTaskInput): Promise<DeleteCodeFromTaskResult> {
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

      throw new AppError(503, "UPSTREAM_UNAVAILABLE", "Unknown error while deleting project code");
    }
  }
}
