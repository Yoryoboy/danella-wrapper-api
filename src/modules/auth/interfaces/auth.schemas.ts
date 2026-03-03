import { z } from "zod";

export const loginBodySchema = z.object({
  username: z.string().min(1, { error: "username is required" }),
  password: z.string().min(1, { error: "password is required" }),
});

export const cookieAuthBodySchema = z.object({
  auth: z.object({
    cookieHeader: z.string().min(1, { error: "auth.cookieHeader is required" }),
  }),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type CookieAuthBody = z.infer<typeof cookieAuthBodySchema>;
