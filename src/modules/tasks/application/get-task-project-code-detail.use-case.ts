import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { GetTaskProjectCodeDetailResult } from "../domain/task.types";

export class GetTaskProjectCodeDetailUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(portfolioId: number, cookieHeader: string): Promise<GetTaskProjectCodeDetailResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "portfolioId must be a positive integer");
    }

    return this.taskRepository.getTaskProjectCodeDetail({ cookieHeader, portfolioId });
  }
}
