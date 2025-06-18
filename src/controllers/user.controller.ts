import { NextFunction, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import AppError from "../utils/appError";
import bcrypt from "bcrypt";
import generateAccessToken from "../utils/generateJWT";
import { isObjectIdOrHexString } from "mongoose";

const prisma = new PrismaClient();

//get user profile
const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      posts: {
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          published: true,
          createdAt: true,
          updatedAt: true,
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    return next(new AppError("User Not Found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "User profile retrieved successfully",
    data: { user },
  });
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      posts: {
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          published: true,
          createdAt: true,
          updatedAt: true,
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  if (!user) {
    return next(new AppError("User Not Found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "user profile retreived successfully",
    data: { user },
  });
};

const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id; // Assuming user ID is stored in req.user after authentication
  const { username, email, oldPassword, newPassword } = req.body || {};

  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return next(new AppError("User Not Found", 404));
  }

  if (email) {
    // Check if the email is already in use by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      return next(new AppError("Email is already in use", 400));
    }
  }

  if (username) {
    // Check if the email is already in use by another user
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== userId) {
      return next(new AppError("username is already in use", 400));
    }
  }

  if (oldPassword && !newPassword) {
    return next(
      new AppError(
        "New password is required when old password is provided",
        400
      )
    );
  }

  const isPasswordValid = oldPassword
    ? await bcrypt.compare(oldPassword, user.password)
    : null;

  if (isPasswordValid === false) {
    return next(new AppError("Old password is incorrect", 400));
  }

  // Update the user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      username,
      email,
      password: newPassword
        ? await bcrypt.hash(newPassword, 10)
        : user.password,
      updatedAt: new Date(), // Update the updatedAt field
    },
  });

  res.status(200).json({
    status: "success",
    message: "User profile updated successfully",
    data: { user: updatedUser },
  });
};

// for admin
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  const users = await prisma.user.findMany();
  if (!users) {
    return next(new AppError("No Users Found", 404));
  }
  res.status(302).json({
    status: "success",
    message: "All users retreived successfully",
    data: { users },
  });
};

const getUserByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return next(new AppError("User Not Found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "user retreived successfully",
    data: { user },
  });
};

const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    data: {
      role: req.body.role,
    },
    where: { id },
  });
  if (!user) {
    return next(new AppError("User Not Found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "user role updated successfully",
    data: { user },
  });
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (req.user.id !== id && req.user.role !== "ADMIN") {
    return next(
      new AppError("You are not authorized to delete this user", 403)
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return next(new AppError("User Not Found", 404));
  }

  if (user.role === "ADMIN") {
    return next(new AppError("You can't delete this user", 400));
  }

  await prisma.user.delete({
    where: { id },
  });

  res.status(200).json({
    status: "success",
    message: "user deleted successfully",
    data: null,
  });
};

export {
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateRole,
  deleteUser,
  getUserProfile,
  updateUserProfile,
};
