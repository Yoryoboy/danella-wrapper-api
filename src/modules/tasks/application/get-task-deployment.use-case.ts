import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { GetTaskDeploymentInput, GetTaskDeploymentResult } from "../domain/task.types";

export class GetTaskDeploymentUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: GetTaskDeploymentInput): Promise<GetTaskDeploymentResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.taskId) || input.taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    return this.taskRepository.getDeployment(input);
  }
}
