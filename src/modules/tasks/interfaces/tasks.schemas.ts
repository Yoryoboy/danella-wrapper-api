import { z } from "zod";

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

export const taskIdQuerySchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const portfolioIdQuerySchema = z.object({
  portfolioId: z.coerce.number().int().positive(),
});

export const addTaskProjectCodeBodySchema = z.object({
  taskId: z.coerce.number().int().positive(),
  portfolioId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  footage: z.coerce.number().min(0).default(0),
});

export const deleteTaskProjectCodeQuerySchema = z.object({
  taskId: z.coerce.number().int().positive(),
  taskProjectCodeId: z.coerce.number().int().positive(),
});

export const taskIdParamsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const deleteTaskProjectCodeParamsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  taskProjectCodeId: z.coerce.number().int().positive(),
});

export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type DeleteTaskProjectCodeParams = z.infer<typeof deleteTaskProjectCodeParamsSchema>;
export type TaskIdQuery = z.infer<typeof taskIdQuerySchema>;
export type PortfolioIdQuery = z.infer<typeof portfolioIdQuerySchema>;
export type AddTaskProjectCodeBody = z.infer<typeof addTaskProjectCodeBodySchema>;
export type DeleteTaskProjectCodeQuery = z.infer<typeof deleteTaskProjectCodeQuerySchema>;
