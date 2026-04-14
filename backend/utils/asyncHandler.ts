import type { Request, Response, NextFunction } from "express";

/**
 * Wraps an async Express middleware/handler so that rejected promises
 * are forwarded to Express error handling via next(error).
 *
 * Express 4 does NOT catch rejected promises from async handlers —
 * without this wrapper, unhandled rejections crash the process or
 * leave requests hanging indefinitely.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
