import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { ValidationError } from "../utils/errors";

export interface ValidatedRequest<T = any> extends Request {
  validatedBody: T;
}

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      (req as any).validatedBody = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const detailedMessage = `Validation failed: ${errorMessages
          .map((err) => `${err.field}: ${err.message}`)
          .join(", ")}`;

        const validationError = new ValidationError(detailedMessage);
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      (req as any).validatedQuery = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const detailedMessage = `Query validation failed: ${errorMessages
          .map((err) => `${err.field}: ${err.message}`)
          .join(", ")}`;

        const validationError = new ValidationError(detailedMessage);
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      (req as any).validatedParams = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        const detailedMessage = `Parameter validation failed: ${errorMessages
          .map((err) => `${err.field}: ${err.message}`)
          .join(", ")}`;

        const validationError = new ValidationError(detailedMessage);
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};
