export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CookieAuthInput {
  cookieHeader: string;
}

export interface LoginResult {
  auth: {
    type: "cookie_passthrough";
    cookieHeader: string;
    obtainedAt: string;
  };
  upstream: {
    loginStatus: number;
    redirectLocation: string | null;
  };
}

export interface ValidateResult {
  valid: boolean;
  reason: "SESSION_VALID" | "SESSION_EXPIRED";
  upstream: {
    status: number;
    url: string;
  };
}

export interface LogoutResult {
  loggedOut: boolean;
  upstream: {
    status: number;
    url: string;
  };
}
