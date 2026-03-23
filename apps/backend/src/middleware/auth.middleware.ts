import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthPayload = {
  userId: string;
  email: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET is missing" });
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;

    // attach user to request (simple)
    (req as any).user = payload;

    return next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}
