import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../utils/redisClient";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  // Add email, role, etc., if needed
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Token required", 401));
    }

    const token = authHeader.split(" ")[1];
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`bl_${token}`);
    if (isBlacklisted) {
      return next(new AppError("Token has been blacklisted", 403));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;

    next();
  } catch (err) {
    next(new AppError("Invalid or expired token", 401));
  }
};

export default verifyToken;
