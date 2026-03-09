import { Router } from "express";
import {
  CreateTaskUseCase,
  GetProjectSecondaryFieldsUseCase,
  GetTaskAttachmentsUseCase,
  GetTaskDetailUseCase,
  GetTaskFormMetadataUseCase,
  ListTasksUseCase,
} from "../application";
import { DanellaTaskClient } from "../infrastructure";
import { TasksController } from "./tasks.controller";

export const createTasksRouter = (): Router => {
  const taskRepository = new DanellaTaskClient();
  const listTasksUseCase = new ListTasksUseCase(taskRepository);
  const createTaskUseCase = new CreateTaskUseCase(taskRepository);
  const getProjectSecondaryFieldsUseCase = new GetProjectSecondaryFieldsUseCase(taskRepository);
  const getTaskDetailUseCase = new GetTaskDetailUseCase(taskRepository);
  const getTaskAttachmentsUseCase = new GetTaskAttachmentsUseCase(taskRepository);
  const getTaskFormMetadataUseCase = new GetTaskFormMetadataUseCase(taskRepository);
  const tasksController = new TasksController(
    listTasksUseCase,
    createTaskUseCase,
    getProjectSecondaryFieldsUseCase,
    getTaskDetailUseCase,
    getTaskAttachmentsUseCase,
    getTaskFormMetadataUseCase,
  );

  const router = Router();

  router.post("/", tasksController.create);
  router.get("/", tasksController.list);
  router.get("/form-metadata", tasksController.formMetadata);
  router.get("/secondary-fields", tasksController.projectSecondaryFields);
  router.get("/attachments", tasksController.attachments);
  router.get("/:taskId", tasksController.getById);
  router.get("/:taskId/attachments", tasksController.attachments);

  return router;
};
