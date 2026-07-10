/**
 * Auth Schemas
 *
 * Strict validation for all authentication endpoints.
 * Password complexity: min 8 chars, must contain uppercase, number, and special character.
 * All schemas use .strict() to reject unknown fields.
 */

import * as z from 'zod';

/** Password complexity regex: at least 1 uppercase, 1 number, 1 special char */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

export const registerSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(30, 'Name must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_ ]+$/, 'Name can only contain letters, numbers, underscores, and spaces')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must not exceed 254 characters')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one number, and one special character'
    ),
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must not exceed 254 characters')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must not exceed 128 characters'),
}).strict();

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
}).strict();

export default {
  registerSchema,
  loginSchema,
  refreshSchema,
};
