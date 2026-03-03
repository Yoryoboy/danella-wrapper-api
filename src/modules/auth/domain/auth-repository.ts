import type { CookieAuthInput, LoginCredentials, LoginResult, LogoutResult, ValidateResult } from "./auth.types";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<LoginResult>;
  validate(input: CookieAuthInput): Promise<ValidateResult>;
  logout(input: CookieAuthInput): Promise<LogoutResult>;
}
