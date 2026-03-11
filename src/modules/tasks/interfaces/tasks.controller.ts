import type { RequestHandler } from "express";

import { AppError } from "../../../shared/domain/app-error";
import { getCookieHeader } from "../../../shared/interfaces/http/get-cookie-header";
import type {
  DeleteTaskUseCase,
  GetTaskAttachmentsUseCase,
  GetTaskDeploymentUseCase,
  GetTaskFormMetadataUseCase,
  ListTasksUseCase,
} from "../application";
import {
  listTasksQuerySchema,
  taskFormMetadataQuerySchema,
  taskIdParamsSchema,
  taskIdQuerySchema,
} from "./tasks.schemas";

export class TasksController {
  constructor(
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly getTaskDeploymentUseCase: GetTaskDeploymentUseCase,
    private readonly getTaskAttachmentsUseCase: GetTaskAttachmentsUseCase,
    private readonly deleteTaskUseCase: DeleteTaskUseCase,
    private readonly getTaskFormMetadataUseCase: GetTaskFormMetadataUseCase,
  ) {}

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

    const cookieHeader = getCookieHeader(req);
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

    const cookieHeader = getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    try {
      const result = await this.getTaskDeploymentUseCase.execute({ taskId, cookieHeader });
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

  delete: RequestHandler = async (req, res, next) => {
    const parsedQuery = taskIdQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid query parameters", {
          fields: parsedQuery.error.flatten(),
        }),
      );
      return;
    }

    const cookieHeader = getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    try {
      const result = await this.deleteTaskUseCase.execute({
        taskId: parsedQuery.data.taskId,
        cookieHeader,
      });
      res.status(result.success ? 200 : 409).json({
        success: result.success,
        message: result.message,
        meta: {
          taskId: parsedQuery.data.taskId,
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

    const cookieHeader = getCookieHeader(req);
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

  formMetadata: RequestHandler = async (req, res, next) => {
    const parsedQuery = taskFormMetadataQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid query parameters", {
          fields: parsedQuery.error.flatten(),
        }),
      );
      return;
    }

    const cookieHeader = getCookieHeader(req);
    if (!cookieHeader) {
      next(new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required"));
      return;
    }

    const subProjectId = parsedQuery.data.subProjectId ?? parsedQuery.data.projectId;

    try {
      const result = await this.getTaskFormMetadataUseCase.execute({
        cookieHeader,
        subProjectId: Number(subProjectId),
      });

      res.status(200).json({
        success: true,
        data: {
          customer: {
            id: result.customer.id,
            name: result.customer.name,
          },
          project: {
            id: result.project.id,
            name: result.project.name,
          },
          subProject: {
            id: result.subProject.id,
            name: result.subProject.name,
          },
          projectType: {
            id: result.projectType.id,
            name: result.projectType.name,
          },
          jobTypeDefault: {
            id: result.jobTypeDefault.id,
            name: result.jobTypeDefault.name,
          },
          endCustomers: result.endCustomers.map((item) => ({
            id: item.id,
            name: item.name,
          })),
          managerAreas: result.managerAreas.map((item) => ({
            id: item.id,
            name: item.name,
          })),
          jobTypesByProjectType: result.jobTypesByProjectType.map((item) => ({
            id: item.id,
            name: item.name,
            projectTypeId: item.projectTypeId,
          })),
        },
        meta: {
          subProjectId: result.subProject.id,
          counts: {
            endCustomers: result.endCustomers.length,
            managerAreas: result.managerAreas.length,
            jobTypesByProjectType: result.jobTypesByProjectType.length,
          },
        },
        upstream: result.upstream,
      });
    } catch (error) {
      next(error);
    }
  };
}
