import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../../domain/app-error";
import { logger } from "../../infrastructure/logger";

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: error.flatten(),
      },
    });
    return;
  }

  logger.error("Unhandled server error", {
    path: req.path,
    message: error instanceof Error ? error.message : "Unknown error",
  });

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
    },
  });
};
