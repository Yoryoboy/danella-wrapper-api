import { z } from "zod";

export const loginBodySchema = z.object({
  username: z.string().min(1, { error: "username is required" }),
  password: z.string().min(1, { error: "password is required" }),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
