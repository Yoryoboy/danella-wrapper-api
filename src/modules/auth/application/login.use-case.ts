import { AppError } from "../../../shared/domain/app-error";
import type { AuthRepository } from "../domain/auth-repository";
import type { LoginCredentials, LoginResult } from "../domain/auth.types";

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<LoginResult> {
    const username = credentials.username.trim();
    const password = credentials.password.trim();

    if (!username || !password) {
      throw new AppError(400, "VALIDATION_ERROR", "username and password are required");
    }

    return this.authRepository.login({ username, password });
  }
}
