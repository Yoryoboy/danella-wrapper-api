import { AppError } from "../../../shared/domain/app-error";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "INVALID_CREDENTIALS", "Invalid username or password");
  }
}

export class UpstreamUnavailableError extends AppError {
  constructor(message = "Could not reach upstream login") {
    super(503, "UPSTREAM_UNAVAILABLE", message);
  }
}

export class AuthFlowError extends AppError {
  constructor(message = "Upstream authentication flow changed") {
    super(502, "UPSTREAM_AUTH_FLOW_ERROR", message);
  }
}
