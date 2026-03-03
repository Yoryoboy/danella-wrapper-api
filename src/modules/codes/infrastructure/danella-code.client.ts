import type { AxiosInstance } from "axios";

import { env } from "../../../config/env";
import { AppError } from "../../../shared/domain/app-error";
import { createDanellaHttpClient } from "../../../shared/infrastructure/danella-http.client";
import { extractConstArray, isLoginHtml } from "../../../shared/infrastructure/html.utils";
import { isRedirectedToLogin } from "../../../shared/infrastructure/response.utils";
import { toUpstreamAppError } from "../../../shared/infrastructure/upstream-error.utils";
import { toAbsoluteUrl } from "../../../shared/infrastructure/url.utils";
import type {
  AddCodeToTaskInput,
  AddCodeToTaskResult,
  AvailableCode,
  CodeRepository,
  CodeDetail,
  DeleteCodeFromTaskInput,
  DeleteCodeFromTaskResult,
  GetAvailableCodesInput,
  GetAvailableCodesResult,
  GetCodeDetailInput,
  GetCodeDetailResult,
} from "../domain";

export class DanellaCodeClient implements CodeRepository {
  private readonly http: AxiosInstance;

  constructor(http?: AxiosInstance) {
    this.http = http ?? createDanellaHttpClient();
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

      if (isRedirectedToLogin(response) || isLoginHtml(response.data)) {
        throw new AppError(401, "SESSION_EXPIRED", "Danella session is expired or invalid");
      }

      return {
        taskId: input.taskId,
        codes: extractConstArray<AvailableCode>(response.data, "portfolioList"),
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream available project codes endpoint" });
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
          "Unexpected project code detail response format from upstream",
        );
      }

      return {
        portfolioId: input.portfolioId,
        detail: response.data as CodeDetail,
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      throw toUpstreamAppError(error, { endpoint: "upstream project code detail endpoint" });
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

      if (isRedirectedToLogin(response)) {
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
      throw toUpstreamAppError(error, { endpoint: "upstream add project code endpoint" });
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

      if (isRedirectedToLogin(response)) {
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
      throw toUpstreamAppError(error, { endpoint: "upstream project code delete endpoint" });
    }
  }
}
