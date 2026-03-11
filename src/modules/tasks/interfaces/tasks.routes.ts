import { Router } from "express";
import {
  DeleteTaskUseCase,
  GetTaskAttachmentsUseCase,
  GetTaskDeploymentUseCase,
  GetTaskFormMetadataUseCase,
  ListTasksUseCase,
} from "../application";
import { DanellaTaskClient } from "../infrastructure";
import { TasksController } from "./tasks.controller";

export const createTasksRouter = (): Router => {
  const taskRepository = new DanellaTaskClient();
  const listTasksUseCase = new ListTasksUseCase(taskRepository);
  const getTaskDeploymentUseCase = new GetTaskDeploymentUseCase(taskRepository);
  const getTaskAttachmentsUseCase = new GetTaskAttachmentsUseCase(taskRepository);
  const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
  const getTaskFormMetadataUseCase = new GetTaskFormMetadataUseCase(taskRepository);
  const tasksController = new TasksController(
    listTasksUseCase,
    getTaskDeploymentUseCase,
    getTaskAttachmentsUseCase,
    deleteTaskUseCase,
    getTaskFormMetadataUseCase,
  );

  const router = Router();

  router.get("/", tasksController.list);
  router.delete("/", tasksController.delete);
  router.get("/form-metadata", tasksController.formMetadata);
  router.get("/deployment", tasksController.deployment);
  router.get("/attachments", tasksController.attachments);

  // Backward-compatible routes (path params) kept temporarily.
  router.get("/:taskId/deployment", tasksController.deployment);
  router.get("/:taskId/attachments", tasksController.attachments);

  return router;
};
