/**
 * Common Reusable Schema Primitives
 *
 * Shared validators used across multiple domain schemas:
 * - MongoDB ObjectId validation
 * - Pagination query params
 * - ISO 8601 date strings
 * - Regex escape utility
 */

import * as z from 'zod';

/** Matches a 24-character hex string (MongoDB ObjectId) */
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates a string as a MongoDB ObjectId.
 * Use for route params like `:id`.
 */
export const mongoIdSchema = z
  .string()
  .regex(OBJECT_ID_REGEX, 'Invalid resource ID format');

/**
 * Validates an ISO 8601 date string (YYYY-MM-DD or full ISO timestamp).
 * Rejects strings that parse to Invalid Date.
 */
export const isoDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format. Use ISO 8601 (e.g. 2024-01-15)' }
  );

/**
 * Validates a future-only ISO 8601 date.
 */
export const futureDateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid date format. Use ISO 8601 (e.g. 2024-01-15)' }
  )
  .refine(
    (val) => new Date(val) > new Date(),
    { message: 'Date must be in the future' }
  );

/**
 * Standard pagination query params.
 * All fields are optional with sensible defaults.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(15),
  sortBy: z.string().max(30).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Escapes special regex characters in a user-provided search string.
 * Prevents ReDoS (Regular Expression Denial of Service) attacks.
 *
 * @param str - Raw user input
 * @returns Escaped string safe for use in `new RegExp()`
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/** Route param schema for endpoints with `:id` */
export const idParamSchema = z.object({
  id: mongoIdSchema,
});

export default {
  mongoIdSchema,
  isoDateSchema,
  futureDateSchema,
  paginationQuerySchema,
  escapeRegex,
  idParamSchema,
};
