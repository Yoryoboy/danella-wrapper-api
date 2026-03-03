export interface LoginCredentials {
  username: string;
  password: string;
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
