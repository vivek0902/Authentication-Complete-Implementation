import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(3, {
    message: "Name is required",
  }),
  email: z.email({
    message: "Invalid email address",
  }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const LoginUserSchema = z.object({
  email: z.email({
    message: "Invalid email address",
  }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});
