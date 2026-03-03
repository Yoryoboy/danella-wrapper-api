import { z } from "zod";

export const taskIdQuerySchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const portfolioIdQuerySchema = z.object({
  portfolioId: z.coerce.number().int().positive(),
});
