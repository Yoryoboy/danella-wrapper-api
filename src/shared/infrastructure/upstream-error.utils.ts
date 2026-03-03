import { AxiosError } from "axios";

import { AppError } from "../domain/app-error";

export interface UpstreamErrorContext {
  endpoint: string;
  defaultStatus?: number;
}

export const toUpstreamAppError = (error: unknown, context: UpstreamErrorContext): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof AxiosError) {
    return new AppError(
      context.defaultStatus ?? 503,
      "UPSTREAM_UNAVAILABLE",
      `Could not reach ${context.endpoint}: ${error.code ?? error.message}`,
    );
  }

  return new AppError(
    context.defaultStatus ?? 503,
    "UPSTREAM_UNAVAILABLE",
    `Unknown error while calling ${context.endpoint}`,
  );
};
