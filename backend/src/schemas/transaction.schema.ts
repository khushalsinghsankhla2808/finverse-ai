/**
 * Transaction Schemas
 *
 * Validates transaction CRUD operations including query params,
 * bulk delete payloads, and individual transaction bodies.
 */

import * as z from 'zod';
import { isoDateSchema, mongoIdSchema, paginationQuerySchema } from './common.schema';

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer'], {
    required_error: 'Transaction type is required',
    invalid_type_error: 'Type must be one of: income, expense, transfer',
  }),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .max(1_000_000_000, 'Amount must not exceed 1,000,000,000'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters')
    .trim(),
  merchant: z
    .string()
    .min(1, 'Merchant is required')
    .max(100, 'Merchant must not exceed 100 characters')
    .trim(),
  date: isoDateSchema,
  note: z
    .string()
    .max(500, 'Note must not exceed 500 characters')
    .optional()
    .default(''),
  name: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  receiptUrl: z
    .string()
    .url('Invalid receipt URL format')
    .or(z.string().length(0))
    .nullable()
    .optional(),
}).strict();

// Helper to convert empty string query parameters to undefined
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema);

/**
 * Query params for GET /transactions.
 * All optional — filters, search, and pagination.
 */
export const transactionQuerySchema = paginationQuerySchema.extend({
  type: emptyToUndefined(z.enum(['income', 'expense', 'transfer'])).optional(),
  category: emptyToUndefined(z.string().max(50)).optional(),
  startDate: emptyToUndefined(
    z.string().refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Invalid startDate format' }
    )
  ).optional(),
  endDate: emptyToUndefined(
    z.string().refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: 'Invalid endDate format' }
    )
  ).optional(),
  search: emptyToUndefined(
    z.string().max(100, 'Search query must not exceed 100 characters')
  ).optional(),
});

/**
 * Bulk delete payload — array of MongoDB ObjectIds.
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(mongoIdSchema)
    .min(1, 'At least one transaction ID is required')
    .max(100, 'Cannot delete more than 100 transactions at once'),
}).strict();

export default {
  transactionSchema,
  transactionQuerySchema,
  bulkDeleteSchema,
};
