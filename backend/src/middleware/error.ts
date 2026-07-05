import type { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps an async route handler so any thrown error is forwarded to the
// central error middleware via next(err) instead of being swallowed.
export function asyncHandler(fn: RequestHandler): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Central error handler — must have exactly 4 parameters so Express
// recognises it as an error-handling middleware.
export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error(err);

    const status = (err as any)?.status ?? (err as any)?.statusCode ?? 500;
    const message =
        err instanceof Error ? err.message : "Something went wrong";

    res.status(status).json({ message });
}
