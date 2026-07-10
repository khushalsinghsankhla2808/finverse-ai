/**
 * Report Schemas
 *
 * Validates report generation requests and download filename params.
 */

import * as z from 'zod';
import { isoDateSchema } from './common.schema';

export const reportSchema = z.object({
  type: z.enum(['monthly', 'yearly', 'custom'], {
    required_error: 'Report type is required',
    invalid_type_error: 'Type must be one of: monthly, yearly, custom',
  }),
  format: z.enum(['pdf', 'excel', 'csv'], {
    required_error: 'Report format is required',
    invalid_type_error: 'Format must be one of: pdf, excel, csv',
  }),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  includeCharts: z.boolean().default(true),
  categories: z
    .array(
      z.string().min(1).max(50)
    )
    .max(20, 'Cannot filter more than 20 categories')
    .optional(),
}).strict();

/**
 * Validates the :filename route param for report downloads.
 * Only allows filenames matching the expected format and blocks
 * path traversal attempts.
 */
const SAFE_FILENAME_REGEX = /^FinVerse_Report_[a-zA-Z]+_\d+\.(pdf|xlsx|csv)$/;

export const downloadFilenameSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(100, 'Filename too long')
    .regex(SAFE_FILENAME_REGEX, 'Invalid report filename format')
    .refine(
      (val) => !val.includes('..') && !val.includes('/') && !val.includes('\\'),
      { message: 'Invalid characters in filename' }
    ),
});

export default { reportSchema, downloadFilenameSchema };
