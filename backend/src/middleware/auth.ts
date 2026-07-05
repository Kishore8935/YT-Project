import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Extend Express's Request type so req.userId is available in every route
// handler that sits behind this middleware — no casting needed.
declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const payload = jwt.verify(auth.slice(7), env.JWT_SECRET) as { userId: string };
        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ message: "Unauthorized" });
    }
}

// Attaches req.userId when a valid token is present, but never blocks the
// request — for routes that are public but personalize their response.
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
        try {
            const payload = jwt.verify(auth.slice(7), env.JWT_SECRET) as { userId: string };
            req.userId = payload.userId;
        } catch {
            // Invalid/expired token on a public route — proceed unauthenticated.
        }
    }
    next();
}
