import { AppError } from "../../../shared/domain/app-error";
import type { CodeRepository } from "../domain/code-repository";
import type { GetAvailableCodesInput, GetAvailableCodesResult } from "../domain/code.types";

export class GetAvailableCodesUseCase {
  constructor(private readonly codeRepository: CodeRepository) {}

  async execute(input: GetAvailableCodesInput): Promise<GetAvailableCodesResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.taskId) || input.taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    return this.codeRepository.getAvailableCodes(input);
  }
}
