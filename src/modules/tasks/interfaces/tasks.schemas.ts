import { z } from "zod";

import { taskIdQuerySchema } from "../../../shared/interfaces/schemas/common.schemas";

export const listTasksQuerySchema = z
  .object({
    subProjectId: z.coerce.number().int().positive().optional(),
    projectId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
    status: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.subProjectId && !value.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "subProjectId is required (projectId is accepted as alias)",
        path: ["subProjectId"],
      });
    }
  });

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export { taskIdQuerySchema };

export const taskIdParamsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const taskFormMetadataQuerySchema = z
  .object({
    subProjectId: z.coerce.number().int().positive().optional(),
    projectId: z.coerce.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.subProjectId && !value.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "subProjectId is required (projectId is accepted as alias)",
        path: ["subProjectId"],
      });
    }
  });

export const projectSecondaryFieldsQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export const createTaskQuerySchema = z.object({
  subProjectId: z.coerce.number().int().positive(),
});

export const createTaskBodySchema = z.object({
  jobId: z.string().trim().min(1),
  verifierKeyId: z.string().trim().min(1),
  endCustomerId: z.coerce.number().int().positive(),
  managerAreaId: z.coerce.number().int().positive(),
});

export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type TaskIdQuery = z.infer<typeof taskIdQuerySchema>;
export type TaskFormMetadataQuery = z.infer<typeof taskFormMetadataQuerySchema>;
export type ProjectSecondaryFieldsQuery = z.infer<typeof projectSecondaryFieldsQuerySchema>;
export type CreateTaskQuery = z.infer<typeof createTaskQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
