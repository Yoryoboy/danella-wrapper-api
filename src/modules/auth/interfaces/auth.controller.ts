import type { RequestHandler } from "express";

import { AppError } from "../../../shared/domain/app-error";
import type { LoginUseCase } from "../application";
import { loginBodySchema } from "./auth.schemas";

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

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
}
