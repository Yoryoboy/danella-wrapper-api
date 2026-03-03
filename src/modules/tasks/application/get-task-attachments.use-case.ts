import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { GetTaskAttachmentsResult } from "../domain/task.types";

export class GetTaskAttachmentsUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(taskId: number, cookieHeader: string): Promise<GetTaskAttachmentsResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    return this.taskRepository.getAttachments({ cookieHeader, taskId });
  }
}
