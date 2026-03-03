import { Router } from "express";
import { ListTasksUseCase } from "../application";
import { DanellaTaskClient } from "../infrastructure";
import { TasksController } from "./tasks.controller";

export const createTasksRouter = (): Router => {
  const taskRepository = new DanellaTaskClient();
  const listTasksUseCase = new ListTasksUseCase(taskRepository);
  const tasksController = new TasksController(listTasksUseCase);

  const router = Router();

  router.get("/", tasksController.list);

  return router;
};
