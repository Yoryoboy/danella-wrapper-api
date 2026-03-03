import type { RequestHandler } from "express";

import { AppError } from "../../../shared/domain/app-error";
import { getCookieHeader } from "../../../shared/interfaces/http/get-cookie-header";
import type { LoginUseCase, LogoutUseCase, ValidateSessionUseCase } from "../application";
import { cookieAuthBodySchema, loginBodySchema } from "./auth.schemas";

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  private getCookieHeader(req: Parameters<RequestHandler>[0]): string | null {
    const bodyParse = cookieAuthBodySchema.safeParse(req.body);
    if (bodyParse.success) {
      return bodyParse.data.auth.cookieHeader;
    }

    return getCookieHeader(req);
  }

  login: RequestHandler = async (req, res, next) => {
    const parsedBody = loginBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Invalid request payload", {
          fields: parsedBody.error.flatten(),
        }),
      );
      return;
    }

    try {
      const result = await this.loginUseCase.execute(parsedBody.data);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  validate: RequestHandler = async (req, res, next) => {
    const cookieHeader = this.getCookieHeader(req);

    if (!cookieHeader) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Provide auth.cookieHeader or x-danella-cookie header"),
      );
      return;
    }

    try {
      const result = await this.validateSessionUseCase.execute({ cookieHeader });
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout: RequestHandler = async (req, res, next) => {
    const cookieHeader = this.getCookieHeader(req);

    if (!cookieHeader) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Provide auth.cookieHeader or x-danella-cookie header"),
      );
      return;
    }

    try {
      const result = await this.logoutUseCase.execute({ cookieHeader });
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
