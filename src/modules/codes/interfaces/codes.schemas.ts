import { z } from "zod";

export const taskIdQuerySchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const portfolioIdQuerySchema = z.object({
  portfolioId: z.coerce.number().int().positive(),
});

export const addCodeBodySchema = z.object({
  taskId: z.coerce.number().int().positive(),
  portfolioId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  footage: z.coerce.number().min(0).default(0),
});

export const deleteCodeQuerySchema = z.object({
  taskId: z.coerce.number().int().positive(),
  taskProjectCodeId: z.coerce.number().int().positive(),
});

export type TaskIdQuery = z.infer<typeof taskIdQuerySchema>;
export type PortfolioIdQuery = z.infer<typeof portfolioIdQuerySchema>;
export type AddCodeBody = z.infer<typeof addCodeBodySchema>;
export type DeleteCodeQuery = z.infer<typeof deleteCodeQuerySchema>;
