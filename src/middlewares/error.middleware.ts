import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiResponse } from "../utils/apiResponse";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  // Zod
  if (err instanceof ZodError) {
    return res.status(400).json(
      ApiResponse.error("Validation error", err.flatten())
    );
  }

  // JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(
      ApiResponse.error("Invalid token")
    );
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(
      ApiResponse.error("Token expired")
    );
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json(ApiResponse.error(message));
};