import { Router } from "express";

export const createTasksRouter = (): Router => {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(501).json({
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Tasks module is scaffolded but not implemented yet",
      },
    });
  });

  return router;
};
