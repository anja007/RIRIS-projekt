import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { Role } from '../models/User';
import { HttpError } from '../lib/errors';

export const TOKEN_COOKIE = 'token';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function setAuthCookie(res: Response, user: AuthUser) {
  const token = jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: user.id,
    expiresIn: TOKEN_TTL_SECONDS,
  });
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE, { httpOnly: true, sameSite: 'lax', secure: config.isProduction });
}

/** Prebere JWT iz piškotka; če ga ni ali ni veljaven, vrne 401. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE];
  if (!token) return next(new HttpError(401, 'Prijavite se'));
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    req.user = { id: payload.sub as string, role: payload.role as Role };
    next();
  } catch {
    next(new HttpError(401, 'Prijavite se'));
  }
}

/** Dovoli dostop samo navedenim vlogam, sicer 403 (US-02). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Prijavite se'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Dostop ni dovoljen'));
    next();
  };
}
