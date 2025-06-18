import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

// Extend the Request type if you're adding custom fields like `user`
interface AuthenticatedRequest extends Request {
  user?: {
    role: string;
    [key: string]: any;
  };
}

const allowedTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You are not allowed to perform this action", 403)
      );
    }
    next();
  };
};

export default allowedTo;
