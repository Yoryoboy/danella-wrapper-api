import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { ListTasksInput, ListTasksResult } from "../domain/task.types";

export class ListTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: ListTasksInput): Promise<ListTasksResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.subProjectId) || input.subProjectId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "subProjectId must be a positive integer");
    }

    if (!Number.isInteger(input.page) || input.page <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "page must be a positive integer");
    }

    if (!Number.isInteger(input.limit) || input.limit <= 0 || input.limit > 200) {
      throw new AppError(400, "VALIDATION_ERROR", "limit must be a positive integer <= 200");
    }

    return this.taskRepository.listBySubProject(input);
  }
}
