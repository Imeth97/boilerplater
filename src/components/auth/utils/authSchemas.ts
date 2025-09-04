import { z } from "zod";
import { passwordSchema } from "@/lib/auth/shared.utils";

export const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

export const resetFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export const newPasswordFormSchema = z.object({
  password: passwordSchema,
});

export const signupFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: passwordSchema,
});