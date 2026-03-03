import { AppError } from "../../../shared/domain/app-error";
import type { CodeRepository } from "../domain/code-repository";
import type { DeleteCodeFromTaskResult } from "../domain/code.types";

export class DeleteCodeFromTaskUseCase {
  constructor(private readonly codeRepository: CodeRepository) {}

  async execute(taskProjectCodeId: number, cookieHeader: string): Promise<DeleteCodeFromTaskResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(taskProjectCodeId) || taskProjectCodeId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskProjectCodeId must be a positive integer");
    }

    return this.codeRepository.deleteCodeFromTask({ cookieHeader, taskProjectCodeId });
  }
}
