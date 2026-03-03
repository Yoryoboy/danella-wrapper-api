import dotenv from "dotenv";

dotenv.config({ quiet: true });

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toNonEmpty = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3000),
  apiVersion: process.env.API_VERSION ?? "v1",
  allowedOrigins: toList(process.env.ALLOWED_ORIGINS),
  danella: {
    baseUrl: toNonEmpty(process.env.DANELLA_BASE_URL, "https://danella-x.com"),
    timeoutMs: toNumber(process.env.DANELLA_TIMEOUT_MS, 30000),
    loginPagePath: toNonEmpty(process.env.DANELLA_LOGIN_PAGE_PATH, "/Home/Login"),
    loginPostPath: process.env.DANELLA_LOGIN_POST_PATH?.trim() ?? "",
    loginUsernameField: toNonEmpty(process.env.DANELLA_LOGIN_USERNAME_FIELD, "Username"),
    loginPasswordField: toNonEmpty(process.env.DANELLA_LOGIN_PASSWORD_FIELD, "Password"),
    tokenField: toNonEmpty(process.env.DANELLA_TOKEN_FIELD, "__RequestVerificationToken"),
    validatePath: toNonEmpty(process.env.DANELLA_VALIDATE_PATH, "/Task/MyTasks"),
    logoutPath: toNonEmpty(process.env.DANELLA_LOGOUT_PATH, "/Home/Logout"),
  },
} as const;
