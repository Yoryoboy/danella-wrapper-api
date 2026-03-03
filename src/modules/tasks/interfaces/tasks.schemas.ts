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
