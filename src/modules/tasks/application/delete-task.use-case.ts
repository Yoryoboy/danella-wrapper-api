import { AppError } from "../../../shared/domain/app-error";
import type { DeleteTaskInput, DeleteTaskResult } from "../domain/task.types";
import type { TaskRepository } from "../domain/task-repository";

export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: DeleteTaskInput): Promise<DeleteTaskResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.taskId) || input.taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    return this.taskRepository.deleteTask(input);
  }
}
