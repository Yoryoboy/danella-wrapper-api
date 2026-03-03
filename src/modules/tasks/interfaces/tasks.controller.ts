import type { RequestHandler } from "express";

import { AppError } from "../../../shared/domain/app-error";
import type { ListTasksUseCase } from "../application";
import { listTasksQuerySchema } from "./tasks.schemas";

export class TasksController {
  constructor(private readonly listTasksUseCase: ListTasksUseCase) {}

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
}
