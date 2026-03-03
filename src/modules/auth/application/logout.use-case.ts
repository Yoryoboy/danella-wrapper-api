import { AppError } from "../../../shared/domain/app-error";
import type { AuthRepository } from "../domain/auth-repository";
import type { CookieAuthInput, LogoutResult } from "../domain/auth.types";

export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: CookieAuthInput): Promise<LogoutResult> {
    const cookieHeader = input.cookieHeader.trim();

    if (!cookieHeader) {
      throw new AppError(400, "VALIDATION_ERROR", "auth.cookieHeader is required");
    }

    return this.authRepository.logout({ cookieHeader });
  }
}
