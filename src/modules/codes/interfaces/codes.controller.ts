import type { RequestHandler } from "express";

import { AppError } from "../../../shared/domain/app-error";
import type {
  AddCodeToTaskUseCase,
  DeleteCodeFromTaskUseCase,
  GetAvailableCodesUseCase,
  GetCodeDetailUseCase,
} from "../application";
import {
  addCodeBodySchema,
  deleteCodeQuerySchema,
  portfolioIdQuerySchema,
  taskIdQuerySchema,
} from "./codes.schemas";

export class CodesController {
  constructor(
    private readonly getAvailableCodesUseCase: GetAvailableCodesUseCase,
    private readonly getCodeDetailUseCase: GetCodeDetailUseCase,
    private readonly addCodeToTaskUseCase: AddCodeToTaskUseCase,
    private readonly deleteCodeFromTaskUseCase: DeleteCodeFromTaskUseCase,
  ) {}

  private getCookieHeader(req: Parameters<RequestHandler>[0]): string | null {
    const customHeader = req.header("x-danella-cookie");
    if (typeof customHeader === "string" && customHeader.trim().length > 0) {
      return customHeader.trim();
    }

    const standardCookieHeader = req.header("cookie");
    if (typeof standardCookieHeader === "string" && standardCookieHeader.trim().length > 0) {
      return standardCookieHeader.trim();
    }

    return null;
  }

  available: RequestHandler = async (req, res, next) => {
    const parsedQuery = taskIdQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid query parameters", {
          fields: parsedQuery.error.flatten(),
        }),
      );
      return;
    }

    const cookieHeader = this.getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    try {
      const result = await this.getAvailableCodesUseCase.execute(parsedQuery.data.taskId, cookieHeader);
      res.status(200).json({
        success: true,
        data: result.codes,
        meta: {
          taskId: result.taskId,
          count: result.codes.length,
        },
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };

  detail: RequestHandler = async (req, res, next) => {
    const parsedQuery = portfolioIdQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid query parameters", {
          fields: parsedQuery.error.flatten(),
        }),
      );
      return;
    }

    const cookieHeader = this.getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    try {
      const result = await this.getCodeDetailUseCase.execute(parsedQuery.data.portfolioId, cookieHeader);
      res.status(200).json({
        success: true,
        data: result.detail,
        meta: {
          portfolioId: result.portfolioId,
        },
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };

  add: RequestHandler = async (req, res, next) => {
    const parsedBody = addCodeBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid request body", {
          fields: parsedBody.error.flatten(),
        }),
      );
      return;
    }

    const cookieHeader = this.getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    try {
      const result = await this.addCodeToTaskUseCase.execute({
        cookieHeader,
        taskId: parsedBody.data.taskId,
        portfolioId: parsedBody.data.portfolioId,
        quantity: parsedBody.data.quantity,
        footage: parsedBody.data.footage,
      });
      res.status(result.success ? 200 : 409).json({
        success: result.success,
        message: result.message,
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };

  delete: RequestHandler = async (req, res, next) => {
    const parsedQuery = deleteCodeQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid query parameters", {
          fields: parsedQuery.error.flatten(),
        }),
      );
      return;
    }

    const cookieHeader = this.getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    try {
      const result = await this.deleteCodeFromTaskUseCase.execute(
        parsedQuery.data.taskProjectCodeId,
        cookieHeader,
      );
      res.status(result.success ? 200 : 409).json({
        success: result.success,
        message: result.message,
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };
}
