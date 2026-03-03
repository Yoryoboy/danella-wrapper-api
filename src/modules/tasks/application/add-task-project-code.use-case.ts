import { AppError } from "../../../shared/domain/app-error";
import type { TaskRepository } from "../domain/task-repository";
import type { AddTaskProjectCodeResult } from "../domain/task.types";

interface AddTaskProjectCodeInput {
  taskId: number;
  portfolioId: number;
  quantity: number;
  footage: number;
  cookieHeader: string;
}

export class AddTaskProjectCodeUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: AddTaskProjectCodeInput): Promise<AddTaskProjectCodeResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.taskId) || input.taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    if (!Number.isInteger(input.portfolioId) || input.portfolioId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "portfolioId must be a positive integer");
    }

    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "quantity must be a positive number");
    }

    if (!Number.isFinite(input.footage) || input.footage < 0) {
      throw new AppError(400, "VALIDATION_ERROR", "footage must be a number >= 0");
    }

    return this.taskRepository.addTaskProjectCode({
      cookieHeader: input.cookieHeader,
      taskId: input.taskId,
      portfolioId: input.portfolioId,
      quantity: input.quantity,
      footage: input.footage,
    });
  }
}
