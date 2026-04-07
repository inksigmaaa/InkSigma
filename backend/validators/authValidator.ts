import { z } from "zod";

export const emailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    redirectTo: z.string().optional(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    token: z.string().min(1),
    newPassword: z.string().min(8), // Assuming minimum 8 chars for passwords
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    token: z.string().min(1),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(8),
  }),
});
