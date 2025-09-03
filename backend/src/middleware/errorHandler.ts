import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // Log error
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === "production" && !error.isOperational) {
    statusCode = 500;
    message = "Something went wrong";
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  });
};
