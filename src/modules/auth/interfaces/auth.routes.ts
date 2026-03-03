import { Router } from "express";

import { LoginUseCase } from "../application";
import { DanellaAuthClient } from "../infrastructure";
import { AuthController } from "./auth.controller";

export const createAuthRouter = (): Router => {
  const authRepository = new DanellaAuthClient();
  const loginUseCase = new LoginUseCase(authRepository);
  const authController = new AuthController(loginUseCase);

  const router = Router();
  router.post("/login", authController.login);

  return router;
};
