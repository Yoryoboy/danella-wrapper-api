import { AppError } from "../../../shared/domain/app-error";
import type { CodeRepository } from "../domain/code-repository";
import type { GetCodeDetailResult } from "../domain/code.types";

export class GetCodeDetailUseCase {
  constructor(private readonly codeRepository: CodeRepository) {}

  async execute(portfolioId: number, cookieHeader: string): Promise<GetCodeDetailResult> {
    if (!cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(portfolioId) || portfolioId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "portfolioId must be a positive integer");
    }

    return this.codeRepository.getCodeDetail({ cookieHeader, portfolioId });
  }
}
