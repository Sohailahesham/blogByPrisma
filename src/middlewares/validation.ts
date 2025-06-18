import { validationResult } from "express-validator";
import appError from "../utils/appError";
import { Request, Response, NextFunction } from "express";

function validator (req: Request, res: Response, next: NextFunction)  {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg).join(", ");
        const error = new appError(errorMessages, 400);
        return next(error);
    }
  next();
};

export { validator };
