import type { RequestHandler } from "express";

import { AppError } from "../../../shared/domain/app-error";
import type {
  DeleteTaskProjectCodeUseCase,
  GetTaskAttachmentsUseCase,
  GetTaskDeploymentUseCase,
  ListTasksUseCase,
} from "../application";
import {
  deleteTaskProjectCodeQuerySchema,
  deleteTaskProjectCodeParamsSchema,
  listTasksQuerySchema,
  taskIdQuerySchema,
  taskIdParamsSchema,
} from "./tasks.schemas";

export class TasksController {
  constructor(
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly getTaskDeploymentUseCase: GetTaskDeploymentUseCase,
    private readonly getTaskAttachmentsUseCase: GetTaskAttachmentsUseCase,
    private readonly deleteTaskProjectCodeUseCase: DeleteTaskProjectCodeUseCase,
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

  list: RequestHandler = async (req, res, next) => {
    const parsedQuery = listTasksQuerySchema.safeParse(req.query);
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

    const query = parsedQuery.data;
    const subProjectId = query.subProjectId ?? query.projectId;

    try {
      const result = await this.listTasksUseCase.execute({
        cookieHeader,
        subProjectId: Number(subProjectId),
        page: query.page,
        limit: query.limit,
        status: query.status,
        search: query.search,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        filters: result.filters,
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };

  deployment: RequestHandler = async (req, res, next) => {
    const parsedFromQuery = taskIdQuerySchema.safeParse(req.query);
    const parsedFromParams = taskIdParamsSchema.safeParse(req.params);
    const taskId = parsedFromQuery.success
      ? parsedFromQuery.data.taskId
      : parsedFromParams.success
        ? parsedFromParams.data.taskId
        : null;

    if (!taskId) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid route parameters", {
          fields: {
            query: parsedFromQuery.success ? undefined : parsedFromQuery.error.flatten(),
            params: parsedFromParams.success ? undefined : parsedFromParams.error.flatten(),
          },
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
      const result = await this.getTaskDeploymentUseCase.execute(taskId, cookieHeader);
      res.status(200).json({
        success: true,
        data: {
          taskId: result.taskId,
          portfolioList: result.portfolioList,
          assignedProjectCodes: result.assignedProjectCodes,
        },
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };

  attachments: RequestHandler = async (req, res, next) => {
    const parsedFromQuery = taskIdQuerySchema.safeParse(req.query);
    const parsedFromParams = taskIdParamsSchema.safeParse(req.params);
    const taskId = parsedFromQuery.success
      ? parsedFromQuery.data.taskId
      : parsedFromParams.success
        ? parsedFromParams.data.taskId
        : null;

    if (!taskId) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid route parameters", {
          fields: {
            query: parsedFromQuery.success ? undefined : parsedFromQuery.error.flatten(),
            params: parsedFromParams.success ? undefined : parsedFromParams.error.flatten(),
          },
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
      const result = await this.getTaskAttachmentsUseCase.execute(taskId, cookieHeader);
      res.status(200).json({
        success: true,
        data: result.attachments,
        meta: {
          taskId: result.taskId,
          count: result.attachments.length,
        },
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProjectCode: RequestHandler = async (req, res, next) => {
    const parsedFromQuery = deleteTaskProjectCodeQuerySchema.safeParse(req.query);
    const parsedFromParams = deleteTaskProjectCodeParamsSchema.safeParse(req.params);
    const taskProjectCodeId = parsedFromQuery.success
      ? parsedFromQuery.data.taskProjectCodeId
      : parsedFromParams.success
        ? parsedFromParams.data.taskProjectCodeId
        : null;

    if (!taskProjectCodeId) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid route parameters", {
          fields: {
            query: parsedFromQuery.success ? undefined : parsedFromQuery.error.flatten(),
            params: parsedFromParams.success ? undefined : parsedFromParams.error.flatten(),
          },
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
      const result = await this.deleteTaskProjectCodeUseCase.execute(
        taskProjectCodeId,
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
