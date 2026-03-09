import { AppError } from "../../../shared/domain/app-error";
import type {
  ResolvedTaskSecondaryFieldUpdate,
  TaskRepository,
  UpdateTaskSecondaryFieldsInput,
  UpdateTaskSecondaryFieldsResult,
} from "../domain";

const normalizeLabel = (value: string): string => value.replace(/\s+/g, " ").trim().toLowerCase();

const normalizeRequestedValue = (value: string): string | null => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export class UpdateTaskSecondaryFieldsUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: UpdateTaskSecondaryFieldsInput): Promise<UpdateTaskSecondaryFieldsResult> {
    if (!input.cookieHeader.trim()) {
      throw new AppError(400, "VALIDATION_ERROR", "x-danella-cookie or Cookie header is required");
    }

    if (!Number.isInteger(input.taskId) || input.taskId <= 0) {
      throw new AppError(400, "VALIDATION_ERROR", "taskId must be a positive integer");
    }

    if (input.fields.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "At least one secondary field update is required");
    }

    const requestedFields = input.fields.reduce<Map<string, { label: string; value: string }>>((acc, field) => {
      const normalizedLabel = normalizeLabel(field.label);
      if (!normalizedLabel) {
        throw new AppError(400, "VALIDATION_ERROR", "Field label cannot be empty");
      }

      if (acc.has(normalizedLabel)) {
        throw new AppError(400, "VALIDATION_ERROR", `Duplicate secondary field label: ${field.label}`);
      }

      acc.set(normalizedLabel, { label: field.label.trim(), value: field.value });
      return acc;
    }, new Map());

    const currentTask = await this.taskRepository.getTaskDetail({
      cookieHeader: input.cookieHeader,
      taskId: input.taskId,
    });

    const availableFields = currentTask.secondaryFields.reduce<Map<string, { label: string; taskSecondaryFieldId: number }>>(
      (acc, field) => {
        const normalizedLabel = normalizeLabel(field.label);
        if (!normalizedLabel || !field.taskSecondaryFieldId) {
          return acc;
        }

        if (acc.has(normalizedLabel)) {
          throw new AppError(
            409,
            "AMBIGUOUS_SECONDARY_FIELD_LABEL",
            `Secondary field label is not unique for this task: ${field.label}`,
          );
        }

        acc.set(normalizedLabel, {
          label: field.label,
          taskSecondaryFieldId: field.taskSecondaryFieldId,
        });
        return acc;
      },
      new Map(),
    );

    const resolvedFields = Array.from(requestedFields.entries()).reduce<ResolvedTaskSecondaryFieldUpdate[]>(
      (acc, [normalizedLabel, requested]) => {
        const availableField = availableFields.get(normalizedLabel);
        if (!availableField) {
          throw new AppError(
            400,
            "VALIDATION_ERROR",
            `Secondary field label is not available for task ${input.taskId}: ${requested.label}`,
          );
        }

        acc.push({
          taskSecondaryFieldId: availableField.taskSecondaryFieldId,
          label: availableField.label,
          value: requested.value,
        });
        return acc;
      },
      [],
    );

    const updateResult = await this.taskRepository.updateTaskSecondaryFields({
      cookieHeader: input.cookieHeader,
      taskId: input.taskId,
      fields: resolvedFields,
    });

    if (!updateResult.success) {
      throw new AppError(409, "UPSTREAM_UPDATE_FAILED", updateResult.message);
    }

    const verifiedTask = await this.taskRepository.getTaskDetail({
      cookieHeader: input.cookieHeader,
      taskId: input.taskId,
    });

    for (const field of resolvedFields) {
      const verifiedField = verifiedTask.secondaryFields.find(
        (item) => item.taskSecondaryFieldId === field.taskSecondaryFieldId,
      );
      const expectedValue = normalizeRequestedValue(field.value);
      const actualValue = verifiedField?.value ?? null;

      if (!verifiedField || actualValue !== expectedValue) {
        throw new AppError(
          502,
          "UPSTREAM_STATE_MISMATCH",
          `Upstream did not persist secondary field update for label: ${field.label}`,
          {
            taskId: input.taskId,
            taskSecondaryFieldId: field.taskSecondaryFieldId,
            expectedValue,
            actualValue,
          },
        );
      }
    }

    return {
      success: true,
      message: updateResult.message,
      data: {
        taskId: input.taskId,
        updatedFields: resolvedFields,
        secondaryFields: verifiedTask.secondaryFields,
      },
      upstream: {
        update: updateResult.upstream,
        verification: verifiedTask.upstream,
      },
    };
  }
}
