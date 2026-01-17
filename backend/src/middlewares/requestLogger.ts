import type { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  next();

  const duration = Date.now() - startedAt;
  // eslint-disable-next-line no-console
  console.log(`${method} ${originalUrl} - ${duration}ms`);
};
