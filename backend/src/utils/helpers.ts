import { Request, Response } from "express";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: any) => Promise<any>
) => {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const sendResponse = (
  res: Response,
  statusCode: number = 200,
  success: boolean = true,
  message?: string,
  data?: any
) => {
  const response: any = {
    success,
    ...(message && { message }),
    ...(data && { data }),
  };

  res.status(statusCode).json(response);
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number = 500,
  message: string = "Internal server error",
  errors?: any
) => {
  const response: any = {
    success: false,
    error: {
      message,
      ...(errors && { details: errors }),
    },
  };

  res.status(statusCode).json(response);
};
