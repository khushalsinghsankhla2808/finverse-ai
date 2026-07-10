/**
 * Goal Schemas
 *
 * Validates savings goal creation, updates, and money contributions.
 */

import * as z from 'zod';
import { isoDateSchema } from './common.schema';

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name must not exceed 100 characters')
    .trim(),
  targetAmount: z
    .number({ required_error: 'Target amount is required' })
    .positive('Target amount must be positive')
    .max(1_000_000_000, 'Target amount must not exceed 1,000,000,000'),
  currentAmount: z
    .number()
    .nonnegative('Current amount cannot be negative')
    .max(1_000_000_000, 'Current amount must not exceed 1,000,000,000')
    .optional()
    .default(0),
  deadline: isoDateSchema,
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters')
    .trim(),
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
    .default('🎯'),
}).strict();

export const addMoneySchema = z.object({
  amount: z
    .number({ required_error: 'Contribution amount is required' })
    .positive('Amount to add must be positive')
    .max(100_000_000, 'Amount must not exceed 100,000,000'),
}).strict();

export default { goalSchema, addMoneySchema };
