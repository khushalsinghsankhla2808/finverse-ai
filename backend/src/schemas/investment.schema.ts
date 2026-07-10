/**
 * Investment Schemas
 *
 * Validates investment portfolio entries with ticker symbol format,
 * quantity bounds, and price precision.
 */

import * as z from 'zod';
import { isoDateSchema } from './common.schema';

/** Ticker symbol: 1-10 uppercase letters, optionally with dots/hyphens for Indian BSE/NSE symbols */
const SYMBOL_REGEX = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export const investmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Investment name is required')
    .max(100, 'Investment name must not exceed 100 characters')
    .trim(),
  assetType: z.enum(
    ['stocks', 'mutual_funds', 'gold', 'crypto', 'fixed_deposit', 'other'],
    {
      required_error: 'Asset type is required',
      invalid_type_error: 'Invalid asset type',
    }
  ),
  symbol: z
    .string()
    .max(10, 'Symbol must not exceed 10 characters')
    .regex(SYMBOL_REGEX, 'Symbol must be 1-10 uppercase alphanumeric characters')
    .optional(),
  units: z
    .number({ required_error: 'Units are required' })
    .positive('Units must be positive')
    .max(1_000_000, 'Units must not exceed 1,000,000'),
  purchasePrice: z
    .number({ required_error: 'Purchase price is required' })
    .positive('Purchase price must be positive')
    .max(100_000_000, 'Purchase price must not exceed 100,000,000'),
  currentPrice: z
    .number({ required_error: 'Current price is required' })
    .positive('Current price must be positive')
    .max(100_000_000, 'Current price must not exceed 100,000,000'),
  purchaseDate: isoDateSchema,
  platform: z
    .string()
    .max(50, 'Platform must not exceed 50 characters')
    .trim()
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
}).strict();

export default { investmentSchema };
