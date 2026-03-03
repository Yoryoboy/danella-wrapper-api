import { AxiosError, type AxiosInstance } from "axios";
import { load } from "cheerio";

import { env } from "../../../config/env";
import { createDanellaHttpClient } from "../../../shared/infrastructure/danella-http.client";
import { isLoginHtml } from "../../../shared/infrastructure/html.utils";
import { logger } from "../../../shared/infrastructure/logger";
import { isRedirectedToLogin } from "../../../shared/infrastructure/response.utils";
import { toUpstreamAppError } from "../../../shared/infrastructure/upstream-error.utils";
import { toAbsoluteUrl } from "../../../shared/infrastructure/url.utils";
import {
  AuthFlowError,
  InvalidCredentialsError,
  UpstreamUnavailableError,
  type AuthRepository,
  type CookieAuthInput,
  type LoginCredentials,
  type LoginResult,
  type LogoutResult,
  type ValidateResult,
} from "../domain";

const extractCookies = (setCookieHeader: string[] | undefined): Map<string, string> => {
  const cookies = new Map<string, string>();

  for (const cookieLine of setCookieHeader ?? []) {
    const firstPart = cookieLine.split(";")[0];
    const separatorIndex = firstPart.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = firstPart.slice(0, separatorIndex).trim();
    const value = firstPart.slice(separatorIndex + 1).trim();

    if (key && value) {
      cookies.set(key, value);
    }
  }

  return cookies;
};

const mapToCookieHeader = (cookies: Map<string, string>): string =>
  Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

const resolveLoginPostPath = (html: string, fallbackPath: string): string => {
  const $ = load(html);
  const action = $("form[action]").first().attr("action");
  return action?.trim() || fallbackPath;
};

const extractAntiForgeryToken = (html: string, tokenField: string): string | null => {
  const $ = load(html);
  const token = $(`input[name="${tokenField}"]`).first().attr("value");
  return token?.trim() ?? null;
};

export class DanellaAuthClient implements AuthRepository {
  private readonly http: AxiosInstance;

  constructor(http?: AxiosInstance) {
    this.http = http ?? createDanellaHttpClient();
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const loginPageResponse = await this.http.get<string>(env.danella.loginPagePath, {
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (loginPageResponse.status < 200 || loginPageResponse.status >= 500) {
        throw new UpstreamUnavailableError("Could not load upstream login page");
      }

      const antiForgeryToken = extractAntiForgeryToken(loginPageResponse.data, env.danella.tokenField);
      if (!antiForgeryToken) {
        throw new AuthFlowError("Missing anti-forgery token in upstream login page");
      }

      const loginPostPath =
        env.danella.loginPostPath || resolveLoginPostPath(loginPageResponse.data, env.danella.loginPagePath);

      const loginPostUrl = toAbsoluteUrl(env.danella.baseUrl, loginPostPath);
      const initialCookies = extractCookies(loginPageResponse.headers["set-cookie"] as string[] | undefined);

      const body = new URLSearchParams();
      body.set(env.danella.loginUsernameField, credentials.username);
      body.set(env.danella.loginPasswordField, credentials.password);
      body.set(env.danella.tokenField, antiForgeryToken);

      const loginResponse = await this.http.post<string>(loginPostUrl, body.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: mapToCookieHeader(initialCookies),
          Referer: toAbsoluteUrl(env.danella.baseUrl, env.danella.loginPagePath),
        },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (loginResponse.status >= 500) {
        throw new UpstreamUnavailableError("Upstream login endpoint is unavailable");
      }

      const loginCookies = extractCookies(loginResponse.headers["set-cookie"] as string[] | undefined);
      const mergedCookies = new Map<string, string>([...initialCookies, ...loginCookies]);
      const hasSessionCookie = mergedCookies.has(".AspNetCore.Session");

      if (loginResponse.status !== 302 || !hasSessionCookie) {
        throw new InvalidCredentialsError();
      }

      const cookieHeader = mapToCookieHeader(mergedCookies);
      if (!cookieHeader) {
        throw new AuthFlowError("Upstream login succeeded but no cookies were captured");
      }

      logger.info("Danella login succeeded", {
        loginStatus: loginResponse.status,
      });

      return {
        auth: {
          type: "cookie_passthrough",
          cookieHeader,
          obtainedAt: new Date().toISOString(),
        },
        upstream: {
          loginStatus: loginResponse.status,
          redirectLocation: typeof loginResponse.headers.location === "string" ? loginResponse.headers.location : null,
        },
      };
    } catch (error) {
      if (
        error instanceof InvalidCredentialsError ||
        error instanceof AuthFlowError ||
        error instanceof UpstreamUnavailableError
      ) {
        throw error;
      }

      if (error instanceof AxiosError) {
        const mappedError = toUpstreamAppError(error, { endpoint: "upstream login" });
        throw new UpstreamUnavailableError(mappedError.message);
      }

      throw new UpstreamUnavailableError("Unknown error while connecting to upstream login");
    }
  }

  async validate(input: CookieAuthInput): Promise<ValidateResult> {
    try {
      const url = toAbsoluteUrl(env.danella.baseUrl, env.danella.validatePath);
      const response = await this.http.get<string>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new UpstreamUnavailableError("Upstream validate endpoint is unavailable");
      }

      const redirectedToLogin = isRedirectedToLogin(response);
      const looksLikeLoginHtml = typeof response.data === "string" && isLoginHtml(response.data);
      const valid = !redirectedToLogin && !looksLikeLoginHtml;

      return {
        valid,
        reason: valid ? "SESSION_VALID" : "SESSION_EXPIRED",
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof UpstreamUnavailableError) {
        throw error;
      }

      const mappedError = toUpstreamAppError(error, { endpoint: "upstream validate endpoint" });
      throw new UpstreamUnavailableError(mappedError.message);
    }
  }

  async logout(input: CookieAuthInput): Promise<LogoutResult> {
    try {
      const url = toAbsoluteUrl(env.danella.baseUrl, env.danella.logoutPath);
      const response = await this.http.get<string>(url, {
        headers: { Cookie: input.cookieHeader },
        maxRedirects: 0,
        validateStatus: () => true,
      });

      if (response.status >= 500) {
        throw new UpstreamUnavailableError("Upstream logout endpoint is unavailable");
      }

      return {
        loggedOut: true,
        upstream: {
          status: response.status,
          url,
        },
      };
    } catch (error) {
      if (error instanceof UpstreamUnavailableError) {
        throw error;
      }

      const mappedError = toUpstreamAppError(error, { endpoint: "upstream logout endpoint" });
      throw new UpstreamUnavailableError(mappedError.message);
    }
  }
}
