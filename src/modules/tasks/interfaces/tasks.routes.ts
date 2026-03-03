import { Router } from "express";
import {
  GetTaskAttachmentsUseCase,
  GetTaskDeploymentUseCase,
  ListTasksUseCase,
} from "../application";
import { DanellaTaskClient } from "../infrastructure";
import { TasksController } from "./tasks.controller";

export const createTasksRouter = (): Router => {
  const taskRepository = new DanellaTaskClient();
  const listTasksUseCase = new ListTasksUseCase(taskRepository);
  const getTaskDeploymentUseCase = new GetTaskDeploymentUseCase(taskRepository);
  const getTaskAttachmentsUseCase = new GetTaskAttachmentsUseCase(taskRepository);
  const tasksController = new TasksController(
    listTasksUseCase,
    getTaskDeploymentUseCase,
    getTaskAttachmentsUseCase,
  );

  const router = Router();

  router.get("/", tasksController.list);
  router.get("/deployment", tasksController.deployment);
  router.get("/attachments", tasksController.attachments);

  // Backward-compatible routes (path params) kept temporarily.
  router.get("/:taskId/deployment", tasksController.deployment);
  router.get("/:taskId/attachments", tasksController.attachments);

  return router;
};
