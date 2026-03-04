import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { CreateTaskResult } from "../domain/task.types";

interface CreateTaskUseCaseInput {
  cookieHeader: string;
  subProjectId: number;
  jobId: string;
  verifierKeyId: string;
  endCustomerId: number;
  managerAreaId: number;
}

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: CreateTaskUseCaseInput): Promise<CreateTaskResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.subProjectId) || input.subProjectId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "subProjectId must be a positive integer");
    }

    if (!input.jobId.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "jobId is required");
    }

    if (!input.verifierKeyId.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "verifierKeyId is required");
    }

    if (!Number.isInteger(input.endCustomerId) || input.endCustomerId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "endCustomerId must be a positive integer");
    }

    if (!Number.isInteger(input.managerAreaId) || input.managerAreaId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "managerAreaId must be a positive integer");
    }

    return this.taskRepository.createTask({
      cookieHeader: input.cookieHeader,
      subProjectId: input.subProjectId,
      jobId: input.jobId.trim(),
      verifierKeyId: input.verifierKeyId.trim(),
      endCustomerId: input.endCustomerId,
      managerAreaId: input.managerAreaId,
    });
  }
}
