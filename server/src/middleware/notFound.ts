import { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Endpoint ${req.method} ${req.originalUrl} not found`;
  res.status(404).json({
    success: false,
    message,
    error: {
      message,
    },
  });
};
