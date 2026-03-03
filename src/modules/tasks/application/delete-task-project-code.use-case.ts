import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { DeleteTaskProjectCodeResult } from "../domain/task.types";

export class DeleteTaskProjectCodeUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(taskProjectCodeId: number, cookieHeader: string): Promise<DeleteTaskProjectCodeResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(taskProjectCodeId) || taskProjectCodeId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskProjectCodeId must be a positive integer");
    }

    return this.taskRepository.deleteTaskProjectCode({ cookieHeader, taskProjectCodeId });
  }
}
