import { z } from "zod";

export const passwordSchema: z.ZodType<string> = z
  .string()
  .min(8, { message: "Password must be at least 8 characters." })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter.",
  })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[\W_]/, {
    message: "Password must contain at least one special character.",
  });
