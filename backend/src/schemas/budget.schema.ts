/**
 * Budget Schemas
 *
 * Validates budget creation and update payloads.
 */

import * as z from 'zod';

export const budgetSchema = z.object({
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters')
    .trim(),
  limit: z
    .number({ required_error: 'Budget limit is required' })
    .positive('Limit must be positive')
    .max(100_000_000, 'Limit must not exceed 100,000,000'),
  period: z
    .enum(['monthly', 'weekly'], {
      invalid_type_error: 'Period must be either monthly or weekly',
    })
    .default('monthly'),
  alertThreshold: z
    .number()
    .min(0, 'Alert threshold must be at least 0')
    .max(100, 'Alert threshold must not exceed 100')
    .default(80),
  color: z
    .string()
    .max(20, 'Color must not exceed 20 characters')
    .regex(/^#[0-9a-fA-F]{3,8}$/, 'Color must be a valid hex color code')
    .optional()
    .default('#7C3AED'),
  icon: z
    .string()
    .max(10, 'Icon must not exceed 10 characters')
    .optional()
    .default('💰'),
}).strict();

export default { budgetSchema };
