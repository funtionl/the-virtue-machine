import type { Request, Response } from "express";
import { getHealthStatus } from "../services/healthService";

export const healthCheck = (_req: Request, res: Response) => {
  res.json(getHealthStatus());
};
