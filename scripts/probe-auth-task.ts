import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ override: true });

type ProbeConfig = {
  baseUrl: string;
  username: string;
  password: string;
  loginPagePath: string;
  loginPostPath?: string;
  usernameField: string;
  passwordField: string;
  tokenField: string;
  taskUrl: string;
  timeoutMs: number;
};

type CookieRecord = Record<string, string>;

type RunArtifact = {
  runAt: string;
  config: Omit<ProbeConfig, "password" | "username">;
  loginPage: {
    url: string;
    status: number;
    contentType: string | null;
    tokenFound: boolean;
    tokenField: string;
    formAction: string | null;
    credentialFields: {
      username: string;
      password: string;
    };
    setCookieNames: string[];
  };
  loginSubmit: {
    url: string;
    status: number;
    authenticated: boolean;
    locationHeader: string | null;
    cookieNames: string[];
    cookieCount: number;
    errorMessages: string[];
    responsePreview: string;
  };
  taskFetch: {
    url: string;
    status: number;
    contentType: string | null;
    bodyType: string;
    bodyShape: string;
    extractedTasksDataCount: number | null;
    responsePreview: string;
  };
  notes: string[];
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getConfig(): ProbeConfig {
  const baseUrl = requiredEnv("DANELLA_BASE_URL");
  const username = requiredEnv("DANELLA_USERNAME");
  const password = requiredEnv("DANELLA_PASSWORD");
  const taskUrl = requiredEnv("DANELLA_TASK_URL");

  return {
    baseUrl,
    username,
    password,
    loginPagePath: process.env.DANELLA_LOGIN_PAGE_PATH?.trim() || "/Home/Login",
    loginPostPath: process.env.DANELLA_LOGIN_POST_PATH?.trim() || undefined,
    usernameField: process.env.DANELLA_LOGIN_USERNAME_FIELD?.trim() || "username",
    passwordField: process.env.DANELLA_LOGIN_PASSWORD_FIELD?.trim() || "password",
    tokenField: process.env.DANELLA_TOKEN_FIELD?.trim() || "__RequestVerificationToken",
    taskUrl,
    timeoutMs: Number(process.env.PROBE_TIMEOUT_MS || 30000),
  };
}

function toAbsoluteUrl(baseUrl: string, maybeRelative: string): string {
  return new URL(maybeRelative, baseUrl).toString();
}

function parseSetCookie(setCookieHeaders: string[] | undefined): CookieRecord {
  const cookies: CookieRecord = {};
  if (!setCookieHeaders || setCookieHeaders.length === 0) {
    return cookies;
  }

  for (const rawCookie of setCookieHeaders) {
    const firstPart = rawCookie.split(";")[0]?.trim();
    if (!firstPart) {
      continue;
    }
    const separatorIndex = firstPart.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = firstPart.slice(0, separatorIndex).trim();
    const value = firstPart.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = value;
    }
  }

  return cookies;
}

function getSetCookieArray(headers: Record<string, unknown>): string[] {
  const setCookieHeader = headers["set-cookie"];
  if (Array.isArray(setCookieHeader)) {
    return setCookieHeader.filter((v): v is string => typeof v === "string");
  }
  if (typeof setCookieHeader === "string") {
    return [setCookieHeader];
  }
  return [];
}

function toCookieHeader(cookies: CookieRecord): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function detectCredentialFields(
  html: string,
  fallbackUserField: string,
  fallbackPassField: string,
): { usernameField: string; passwordField: string } {
  const $ = cheerio.load(html);
  const passwordName = $('input[type="password"]').first().attr("name") || fallbackPassField;
  const userCandidates = [
    $('input[type="email"]').first().attr("name"),
    $('input[name*="user" i]').first().attr("name"),
    $('input[name*="email" i]').first().attr("name"),
    $('input[type="text"]').first().attr("name"),
  ].filter((v): v is string => Boolean(v));

  return {
    usernameField: userCandidates[0] || fallbackUserField,
    passwordField: passwordName,
  };
}

function extractTasksDataFromHtml(html: string): unknown[] | null {
  const scripts = [
    /var\s+tasksData\s*=\s*(\[[\s\S]*?\]);/i,
    /let\s+tasksData\s*=\s*(\[[\s\S]*?\]);/i,
    /const\s+tasksData\s*=\s*(\[[\s\S]*?\]);/i,
  ];

  for (const pattern of scripts) {
    const match = html.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractHtmlErrorMessages(html: string): string[] {
  const $ = cheerio.load(html);
  const messages = new Set<string>();

  $(".alert.alert-danger, .validation-summary-errors, .text-danger").each((_idx, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) {
      messages.add(text);
    }
  });

  return Array.from(messages);
}

function describeBodyShape(data: unknown): string {
  if (Array.isArray(data)) {
    const first = data[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return `array<object> keys=${Object.keys(first as object).slice(0, 10).join(",")}`;
    }
    return "array<primitive|unknown>";
  }

  if (data && typeof data === "object") {
    return `object keys=${Object.keys(data as object).slice(0, 20).join(",")}`;
  }

  return typeof data;
}

function bodyPreview(data: unknown): string {
  if (typeof data === "string") {
    return data.slice(0, 1200);
  }
  try {
    return JSON.stringify(data, null, 2).slice(0, 1200);
  } catch {
    return String(data).slice(0, 1200);
  }
}

function responseContentType(headers: Record<string, unknown>): string | null {
  const contentType = (headers["content-type"] ?? headers["Content-Type"]) as
    | string
    | string[]
    | undefined;
  if (!contentType) {
    return null;
  }
  if (Array.isArray(contentType)) {
    return contentType.join(", ");
  }
  return String(contentType);
}

function printSection(title: string): void {
  console.log(`\n========== ${title} ==========`);
}

function redactFormValue(key: string, value: string): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("password") || lowerKey.includes("token")) {
    return `[set:${value.length}]`;
  }
  return value ? `[set:${value.length}]` : "[empty]";
}

function redactedFormPreview(payload: URLSearchParams): string {
  return Array.from(payload.entries())
    .map(([key, value]) => `${key}=${redactFormValue(key, value)}`)
    .join("&");
}

function persistRun(run: RunArtifact): void {
  const findingsDir = path.resolve("findings");
  const runsDir = path.join(findingsDir, "runs");
  fs.mkdirSync(runsDir, { recursive: true });

  const stamp = run.runAt.replace(/[:.]/g, "-");
  const runFile = path.join(runsDir, `${stamp}-probe.json`);
  fs.writeFileSync(runFile, `${JSON.stringify(run, null, 2)}\n`, "utf8");

  const mdPath = path.join(findingsDir, "discovery-log.md");
  if (!fs.existsSync(mdPath)) {
    fs.writeFileSync(mdPath, "# Danella Endpoint Discovery Log\n\n", "utf8");
  }

  const noteLines =
    run.notes.length > 0 ? run.notes.map((n) => `- ${n}`).join("\n") : "- No notable warnings.";

  const markdownEntry = [
    `## Run ${run.runAt}`,
    "",
    "### Auth Flow",
    `- Login page: \`${run.loginPage.url}\` -> \`${run.loginPage.status}\``,
    `- Anti-CSRF token (${run.loginPage.tokenField}): ${run.loginPage.tokenFound ? "found" : "missing"}`,
    `- Form action discovered: ${run.loginPage.formAction ?? "none"}`,
    `- Credential fields detected: user=\`${run.loginPage.credentialFields.username}\`, pass=\`${run.loginPage.credentialFields.password}\``,
    `- Login page cookies: ${run.loginPage.setCookieNames.join(", ") || "none"}`,
    `- Login submit: \`${run.loginSubmit.url}\` -> \`${run.loginSubmit.status}\``,
    `- Authenticated signal: ${run.loginSubmit.authenticated ? "yes" : "no"}`,
    `- Redirect location: ${run.loginSubmit.locationHeader ?? "none"}`,
    `- Cookies returned (${run.loginSubmit.cookieCount}): ${run.loginSubmit.cookieNames.join(", ") || "none"}`,
    `- Login errors: ${run.loginSubmit.errorMessages.join(" | ") || "none"}`,
    "",
    "### Task Endpoint Probe",
    `- URL: \`${run.taskFetch.url}\``,
    `- Status: \`${run.taskFetch.status}\``,
    `- Content-Type: \`${run.taskFetch.contentType ?? "unknown"}\``,
    `- Body type: \`${run.taskFetch.bodyType}\``,
    `- Body shape: \`${run.taskFetch.bodyShape}\``,
    `- Extracted tasksData count: \`${run.taskFetch.extractedTasksDataCount ?? "n/a"}\``,
    "",
    "### Notes",
    noteLines,
    "",
    `Artifact JSON: \`findings/runs/${path.basename(runFile)}\``,
    "",
    "---",
    "",
  ].join("\n");

  fs.appendFileSync(mdPath, markdownEntry, "utf8");
  console.log(`\nSaved run artifact: ${runFile}`);
  console.log(`Updated discovery log: ${mdPath}`);
}

async function runProbe(): Promise<void> {
  const config = getConfig();
  const { username: _username, password: _password, ...safeConfig } = config;
  const notes: string[] = [];
  const runAt = new Date().toISOString();

  const loginPageUrl = toAbsoluteUrl(config.baseUrl, config.loginPagePath);
  const taskUrl = toAbsoluteUrl(config.baseUrl, config.taskUrl);

  printSection("Step 1: Fetch login page");
  const loginPageRes = await axios.get<string>(loginPageUrl, {
    timeout: config.timeoutMs,
    responseType: "text",
    validateStatus: () => true,
  });
  const loginPageHtml = String(loginPageRes.data ?? "");
  const $ = cheerio.load(loginPageHtml);
  const token = $(`input[name="${config.tokenField}"]`).attr("value") ?? null;
  const detectedFormAction = $("form").first().attr("action") ?? null;
  const loginPageSetCookieArray = getSetCookieArray(loginPageRes.headers as Record<string, unknown>);
  const loginPageCookies = parseSetCookie(loginPageSetCookieArray);
  const detectedFields = detectCredentialFields(
    loginPageHtml,
    config.usernameField,
    config.passwordField,
  );

  console.log(`Login page status: ${loginPageRes.status}`);
  console.log(`Token field '${config.tokenField}' found: ${token ? "yes" : "no"}`);
  console.log(`Detected form action: ${detectedFormAction ?? "none"}`);
  console.log(`Detected username field: ${detectedFields.usernameField}`);
  console.log(`Detected password field: ${detectedFields.passwordField}`);
  console.log(`Login page cookies: ${Object.keys(loginPageCookies).join(", ") || "none"}`);

  const loginPostUrl = config.loginPostPath
    ? toAbsoluteUrl(config.baseUrl, config.loginPostPath)
    : detectedFormAction
      ? toAbsoluteUrl(config.baseUrl, detectedFormAction)
      : loginPageUrl;

  if (!token) {
    notes.push(
      `Anti-CSRF token '${config.tokenField}' was not found on login page. Login may fail unless the target form does not require it.`,
    );
  }

  printSection("Step 2: Submit login");
  const payload = new URLSearchParams();
  payload.set(detectedFields.usernameField, config.username);
  payload.set(detectedFields.passwordField, config.password);
  if (token) {
    payload.set(config.tokenField, token);
  }
  console.log(
    `Credential env loaded: username=${config.username ? `[set:${config.username.length}]` : "[empty]"}, password=${config.password ? `[set:${config.password.length}]` : "[empty]"}`,
  );
  console.log(`Login payload fields: ${Array.from(payload.keys()).join(", ")}`);
  console.log(`Login payload preview (redacted): ${redactedFormPreview(payload)}`);

  const loginRes = await axios.post(loginPostUrl, payload, {
    timeout: config.timeoutMs,
    maxRedirects: 0,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: new URL(config.baseUrl).origin,
      Referer: loginPageUrl,
      Cookie: toCookieHeader(loginPageCookies),
    },
    validateStatus: () => true,
  });

  const setCookieArray = getSetCookieArray(loginRes.headers as Record<string, unknown>);
  const cookies = parseSetCookie(setCookieArray);
  const cookieNames = Object.keys(cookies);
  const loginResponseHtml = typeof loginRes.data === "string" ? loginRes.data : "";
  const loginErrorMessages = extractHtmlErrorMessages(loginResponseHtml);
  const mergedCookies = {
    ...loginPageCookies,
    ...cookies,
  };
  const hasSessionCookie = Object.keys(mergedCookies).some((name) => name.startsWith(".AspNetCore.Session"));
  const isLikelyAuthenticated = hasSessionCookie || (loginRes.status >= 300 && loginRes.status < 400);

  console.log(`Login submit status: ${loginRes.status}`);
  console.log(`Cookies captured: ${cookieNames.join(", ") || "none"}`);
  console.log(`Redirect location: ${String(loginRes.headers.location || "none")}`);
  console.log(`Authenticated signal: ${isLikelyAuthenticated ? "yes" : "no"}`);
  if (loginErrorMessages.length > 0) {
    console.log(`Login error messages: ${loginErrorMessages.join(" | ")}`);
  }

  if (cookieNames.length === 0) {
    notes.push("No cookies were captured from login response headers.");
  }
  if (loginErrorMessages.length > 0) {
    notes.push(`Login returned error text: ${loginErrorMessages.join(" | ")}`);
  }
  const cookieHeader = toCookieHeader(mergedCookies);

  printSection("Step 3: Fetch task endpoint");
  const taskRes = await axios.get(taskUrl, {
    timeout: config.timeoutMs,
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    responseType: "text",
    validateStatus: () => true,
    transformResponse: [
      (raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      },
    ],
  });

  const taskData = taskRes.data;
  const taskBodyType = Array.isArray(taskData) ? "array" : typeof taskData;
  let normalizedTaskData: unknown = taskData;
  let extractedTasksDataCount: number | null = null;
  if (typeof taskData === "string") {
    const extractedTasksData = extractTasksDataFromHtml(taskData);
    if (extractedTasksData) {
      normalizedTaskData = extractedTasksData;
      extractedTasksDataCount = extractedTasksData.length;
      notes.push(`Extracted tasksData array from HTML with ${extractedTasksData.length} tasks.`);
    } else if (taskData.includes("/Home/Login") && taskData.includes("__RequestVerificationToken")) {
      notes.push("Task endpoint returned login HTML; request is unauthenticated.");
    }
  }
  const taskShape = describeBodyShape(normalizedTaskData);
  const effectiveTaskBodyType = Array.isArray(normalizedTaskData) ? "array" : typeof normalizedTaskData;

  console.log(`Task fetch status: ${taskRes.status}`);
  console.log(
    `Task content type: ${responseContentType(taskRes.headers as Record<string, unknown>) ?? "unknown"}`,
  );
  console.log(`Task body type: ${effectiveTaskBodyType}`);
  console.log(`Task body shape: ${taskShape}`);
  if (extractedTasksDataCount !== null) {
    console.log(`Extracted tasksData count: ${extractedTasksDataCount}`);
  }
  console.log("Task response preview:");
  console.log(bodyPreview(normalizedTaskData));

  const runArtifact: RunArtifact = {
    runAt,
    config: safeConfig,
    loginPage: {
      url: loginPageUrl,
      status: loginPageRes.status,
      contentType: responseContentType(loginPageRes.headers as Record<string, unknown>),
      tokenFound: Boolean(token),
      tokenField: config.tokenField,
      formAction: detectedFormAction,
      credentialFields: {
        username: detectedFields.usernameField,
        password: detectedFields.passwordField,
      },
      setCookieNames: Object.keys(loginPageCookies),
    },
    loginSubmit: {
      url: loginPostUrl,
      status: loginRes.status,
      authenticated: isLikelyAuthenticated,
      locationHeader: loginRes.headers.location ? String(loginRes.headers.location) : null,
      cookieNames,
      cookieCount: cookieNames.length,
      errorMessages: loginErrorMessages,
      responsePreview: bodyPreview(loginRes.data),
    },
    taskFetch: {
      url: taskUrl,
      status: taskRes.status,
      contentType: responseContentType(taskRes.headers as Record<string, unknown>),
      bodyType: effectiveTaskBodyType,
      bodyShape: taskShape,
      extractedTasksDataCount,
      responsePreview: bodyPreview(normalizedTaskData),
    },
    notes,
  };

  persistRun(runArtifact);
}

runProbe().catch((error: unknown) => {
  printSection("Probe failed");
  if (error instanceof AxiosError) {
    console.error(`Axios error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response preview: ${bodyPreview(error.response.data)}`);
    }
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});
