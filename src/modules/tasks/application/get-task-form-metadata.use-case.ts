import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { GetTaskFormMetadataInput, GetTaskFormMetadataResult } from "../domain/task.types";

export class GetTaskFormMetadataUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: GetTaskFormMetadataInput): Promise<GetTaskFormMetadataResult> {
    if (!input.cookieHeader) {
      throw new AppError(400, "VALIDATION_ERROR", "cookieHeader is required");
    }

    if (!Number.isInteger(input.subProjectId) || input.subProjectId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "subProjectId must be a positive integer");
    }

    return this.taskRepository.getTaskFormMetadata(input);
  }
}
