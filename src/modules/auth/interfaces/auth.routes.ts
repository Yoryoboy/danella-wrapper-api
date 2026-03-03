import { Router } from "express";

import { LoginUseCase, LogoutUseCase, ValidateSessionUseCase } from "../application";
import { DanellaAuthClient } from "../infrastructure";
import { AuthController } from "./auth.controller";

export const createAuthRouter = (): Router => {
  const authRepository = new DanellaAuthClient();
  const loginUseCase = new LoginUseCase(authRepository);
  const validateSessionUseCase = new ValidateSessionUseCase(authRepository);
  const logoutUseCase = new LogoutUseCase(authRepository);
  const authController = new AuthController(loginUseCase, validateSessionUseCase, logoutUseCase);

  const router = Router();
  router.post("/login", authController.login);
  router.post("/validate", authController.validate);
  router.post("/logout", authController.logout);

  return router;
};
