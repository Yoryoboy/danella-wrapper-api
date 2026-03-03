import { Router } from "express";

import { createAuthRouter } from "./auth/interfaces";
import { createTasksRouter } from "./tasks/interfaces";

export const createApiV1Router = (): Router => {
  const router = Router();

  router.use("/auth", createAuthRouter());
  router.use("/tasks", createTasksRouter());

  return router;
};
