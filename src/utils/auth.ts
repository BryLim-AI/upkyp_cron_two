import { Request, Response, NextFunction } from "express";

export function verifyCron(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.CRON_API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
