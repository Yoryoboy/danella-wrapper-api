import { AppError } from "../../../shared/domain/app-error";
import type { AuthRepository } from "../domain/auth-repository";
import type { CookieAuthInput, ValidateResult } from "../domain/auth.types";

export class ValidateSessionUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: CookieAuthInput): Promise<ValidateResult> {
    const cookieHeader = input.cookieHeader.trim();

    if (!cookieHeader) {
      throw new AppError(400, "VALIDATION_ERROR", "auth.cookieHeader is required");
    }

    return this.authRepository.validate({ cookieHeader });
  }
}
