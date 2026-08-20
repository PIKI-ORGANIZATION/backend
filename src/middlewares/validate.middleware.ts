import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema, target: "body" | "params" | "query" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      });
    }

    req[target] = result.data;
    next();
  };