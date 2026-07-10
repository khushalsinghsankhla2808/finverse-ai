/**
 * Validation Middleware
 *
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Returns structured errors with { field, message, receivedType } per violation.
 * Uses .strict() parsing to reject unknown fields.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

interface ValidateOptions {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Creates validation middleware from Zod schemas.
 *
 * @example
 * // Validate body only (backward compatible)
 * router.post('/register', validate(registerSchema), handler);
 *
 * @example
 * // Validate body + query + params
 * router.get('/:id', validate({ params: idParamSchema, query: querySchema }), handler);
 */
export const validate = (schemaOrOptions: ZodTypeAny | ValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const errors: Array<{ field: string; message: string; receivedType: string }> = [];

    // Determine whether we received a single body schema or multi-target options
    const options: ValidateOptions =
      'parse' in schemaOrOptions
        ? { body: schemaOrOptions as ZodTypeAny }
        : (schemaOrOptions as ValidateOptions);

    try {
      // Validate params
      if (options.params) {
        try {
          const parsed = await options.params.parseAsync(req.params);
          req.params = parsed;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `params.${e.path.join('.')}`,
                message: e.message,
                receivedType: typeof req.params[e.path[0] as string],
              }))
            );
          }
        }
      }

      // Validate query
      if (options.query) {
        try {
          const parsed = await options.query.parseAsync(req.query);
          req.query = parsed;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: `query.${e.path.join('.')}`,
                message: e.message,
                receivedType: typeof req.query[e.path[0] as string],
              }))
            );
          }
        }
      }

      // Validate body
      if (options.body) {
        try {
          const parsed = await options.body.parseAsync(req.body);
          req.body = parsed;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
                receivedType: typeof req.body?.[e.path[0] as string],
              }))
            );
          }
        }
      }

      // If any validation errors accumulated, reject the request
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      next();
    } catch (error) {
      // Unexpected non-Zod errors
      next(error);
    }
  };
};

export default validate;
