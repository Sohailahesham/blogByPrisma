import { NextFunction, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import AppError from "../utils/appError";
import bcrypt from "bcrypt";
import generateAccessToken from "../utils/generateJWT";
import { redisClient } from "../utils/redisClient";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });
  const accessToken = generateAccessToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });
  res.status(201).json({
    status: "success",
    message: "User created successfully",
    data: { user: newUser, accessToken },
  });
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return next(new AppError("No user with this email", 404));
  }
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError("Incorrect Password", 404));
  }
  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  res.status(200).json({
    status: "success",
    message: "User logged in successfully",
    data: { user, accessToken },
  });
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AppError("No token provided", 401));
  }

  // Decode to get expiry
  const decoded: any = jwt.decode(token);
  const expiresAt = decoded?.exp;

  if (!expiresAt) {
    return next(new AppError("Invalid token", 400));
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = expiresAt - now; // Time until expiry in seconds

  await redisClient.setEx(`bl_${token}`, ttl, "blacklisted");

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
    data: null,
  });
};

export { register, login, logout };
