import { AppError } from "../../../shared/domain/app-error";
import type { CodeRepository } from "../domain/code-repository";
import type { GetAvailableCodesResult } from "../domain/code.types";

export class GetAvailableCodesUseCase {
  constructor(private readonly codeRepository: CodeRepository) {}

  async execute(taskId: number, cookieHeader: string): Promise<GetAvailableCodesResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(taskId) || taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    return this.codeRepository.getAvailableCodes({ cookieHeader, taskId });
  }
}
