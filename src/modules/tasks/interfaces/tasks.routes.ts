import { Router } from "express";
import {
  AddTaskProjectCodeUseCase,
  DeleteTaskProjectCodeUseCase,
  GetAvailableTaskProjectCodesUseCase,
  GetTaskAttachmentsUseCase,
  GetTaskDeploymentUseCase,
  GetTaskProjectCodeDetailUseCase,
  ListTasksUseCase,
} from "../application";
import { DanellaTaskClient } from "../infrastructure";
import { TasksController } from "./tasks.controller";

export const createTasksRouter = (): Router => {
  const taskRepository = new DanellaTaskClient();
  const listTasksUseCase = new ListTasksUseCase(taskRepository);
  const getTaskDeploymentUseCase = new GetTaskDeploymentUseCase(taskRepository);
  const getTaskAttachmentsUseCase = new GetTaskAttachmentsUseCase(taskRepository);
  const getAvailableTaskProjectCodesUseCase = new GetAvailableTaskProjectCodesUseCase(taskRepository);
  const getTaskProjectCodeDetailUseCase = new GetTaskProjectCodeDetailUseCase(taskRepository);
  const addTaskProjectCodeUseCase = new AddTaskProjectCodeUseCase(taskRepository);
  const deleteTaskProjectCodeUseCase = new DeleteTaskProjectCodeUseCase(taskRepository);
  const tasksController = new TasksController(
    listTasksUseCase,
    getTaskDeploymentUseCase,
    getTaskAttachmentsUseCase,
    getAvailableTaskProjectCodesUseCase,
    getTaskProjectCodeDetailUseCase,
    addTaskProjectCodeUseCase,
    deleteTaskProjectCodeUseCase,
  );

  const router = Router();

  router.get("/", tasksController.list);
  router.get("/deployment", tasksController.deployment);
  router.get("/attachments", tasksController.attachments);
  router.get("/project-codes/available", tasksController.availableProjectCodes);
  router.get("/project-codes/detail", tasksController.projectCodeDetail);
  router.post("/project-codes", tasksController.addProjectCode);
  router.delete("/project-codes", tasksController.deleteProjectCode);

  // Backward-compatible routes (path params) kept temporarily.
  router.get("/:taskId/deployment", tasksController.deployment);
  router.get("/:taskId/attachments", tasksController.attachments);
  router.delete("/:taskId/project-codes/:taskProjectCodeId", tasksController.deleteProjectCode);

  return router;
};
