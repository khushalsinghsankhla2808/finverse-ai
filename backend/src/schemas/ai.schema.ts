/**
 * AI Chat Schemas
 *
 * Validates AI assistant chat messages and session identifiers.
 */

import * as z from 'zod';
import { mongoIdSchema } from './common.schema';

export const chatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must not exceed 2000 characters')
    .trim(),
  sessionId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format')
    .optional(),
}).strict();

export default { chatSchema };
