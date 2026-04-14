import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// HTTP methods that carry a request body and require Content-Type: application/json.
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);

/**
 * Zod-based request validation middleware factory.
 *
 * Validates `req.body`, `req.query`, and `req.params` against the provided
 * schema, then merges the coerced/parsed values back into the request object
 * so downstream handlers receive typed, validated data.
 *
 * Usage:
 * ```ts
 * const schema = z.object({
 *   body: z.object({ title: z.string().min(1) }),
 *   params: z.object({ id: z.string() }),
 * });
 *
 * router.post("/:id", validate(schema), async (req, res) => {
 *   // req.body and req.params are typed and validated
 * });
 * ```
 */
export const validate = <T extends z.ZodType>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Enforce Content-Type for methods that carry a body.
    // A missing or wrong Content-Type causes req.body to be undefined,
    // which leads to confusing validation errors instead of a clear 415.
    if (BODY_METHODS.has(req.method) && !req.is("application/json")) {
      res.status(415).json({
        error: "Content-Type must be application/json",
        code: "UNSUPPORTED_MEDIA_TYPE",
      });
      return;
    }

    try {
      const validatedData = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as Record<string, unknown>;

      // Merge coerced data back into request.
      if (validatedData.body) req.body = validatedData.body;
      if (validatedData.query) req.query = validatedData.query as typeof req.query;
      if (validatedData.params) {
        Object.assign(req.params, validatedData.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
        });
        return;
      }

      // Non-Zod errors (e.g., a transform that throws) should propagate
      // to the centralized error handler, not return a generic 500.
      next(error);
    }
  };
};
