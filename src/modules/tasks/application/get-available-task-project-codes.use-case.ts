import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { GetAvailableTaskProjectCodesResult } from "../domain/task.types";

export class GetAvailableTaskProjectCodesUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(taskId: number, cookieHeader: string): Promise<GetAvailableTaskProjectCodesResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    return this.taskRepository.getAvailableTaskProjectCodes({ cookieHeader, taskId });
  }
}
