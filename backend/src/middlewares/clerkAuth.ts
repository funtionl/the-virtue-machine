import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export function requireClerkAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth = getAuth(req);

  if (!auth?.isAuthenticated || !auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // attach to req for convenience
  (req as any).clerkAuth = auth;
  return next();
}

export function getClerkUserId(req: Request): string {
  const auth = (req as any).clerkAuth ?? getAuth(req);

  if (!auth?.userId) {
    throw new Error("User not authenticated");
  }
  return auth.userId as string;
}
