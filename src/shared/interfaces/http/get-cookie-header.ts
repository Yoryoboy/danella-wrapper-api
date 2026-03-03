import type { Request } from "express";

export const getCookieHeader = (req: Request): string | null => {
  const customHeader = req.header("x-danella-cookie");
  if (typeof customHeader === "string" && customHeader.trim().length > 0) {
    return customHeader.trim();
  }

  const standardCookieHeader = req.header("cookie");
  if (typeof standardCookieHeader === "string" && standardCookieHeader.trim().length > 0) {
    return standardCookieHeader.trim();
  }

  return null;
};
