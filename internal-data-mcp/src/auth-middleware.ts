import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  userId?: string;
  orgId?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    // Validate against your internal auth system
    const claims = validateInternalToken(token);
    req.userId = claims.sub;
    req.orgId = claims.org;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

function validateInternalToken(token: string) {
  // Replace with your actual token validation:
  // - JWT verification against your auth service
  // - API key lookup in your database
  // - Session token validation against Redis
  // This is a placeholder
  return { sub: "user-123", org: "org-456" };
}