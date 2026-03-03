import type { LoginCredentials, LoginResult } from "./auth.types";

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<LoginResult>;
}
