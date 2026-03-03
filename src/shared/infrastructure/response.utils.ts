import type { AxiosResponse } from "axios";

type LoginRedirectCheckResponse = Pick<AxiosResponse, "status" | "headers">;

export const isRedirectedToLogin = (response: LoginRedirectCheckResponse): boolean => {
  return (
    response.status >= 300 &&
    response.status < 400 &&
    typeof response.headers.location === "string" &&
    response.headers.location.toLowerCase().includes("/home/login")
  );
};
