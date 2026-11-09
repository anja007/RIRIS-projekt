import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Ovije asinhroni handler, da napake pridejo do errorHandler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    const first = Object.values(fieldErrors)[0];
    res.status(400).json({ message: first ?? 'Neveljavni podatki', fieldErrors });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, fieldErrors: err.fieldErrors });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Napaka na strežniku' });
}
