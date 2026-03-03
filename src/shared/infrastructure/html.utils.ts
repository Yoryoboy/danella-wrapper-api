import { AppError } from "../domain/app-error";

export const isLoginHtml = (html: string): boolean => {
  const normalized = html.toLowerCase();
  return (
    normalized.includes("__requestverificationtoken") ||
    normalized.includes("/home/login") ||
    normalized.includes("name=\"username\"")
  );
};

export const extractConstArray = <T extends Record<string, unknown>>(
  html: string,
  name: string,
): T[] => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`const\\s+${escapedName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const match = html.match(regex);

  if (!match?.[1]) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    throw new AppError(502, "UPSTREAM_PARSE_ERROR", `Could not parse ${name} payload from upstream HTML`);
  }
};
