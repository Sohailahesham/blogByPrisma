import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import AppError from "./utils/appError";

import authRouter from "./routes/auth.routes";
import postRouter from "./routes/post.routes";
import userRouter from "./routes/user.routes";
import commentRouter from "./routes/comments.routes";
import tagsRouter from "./routes/tags.routes";

import crypto from "crypto";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

//console.log(crypto.randomBytes(64).toString('hex', 16));

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/users", userRouter);

app.use(
  (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.status(err.statusCode || 500).json({
      status: err.status || "error",
      message: err.message,
      code: err.statusCode || 500,
      data: null,
    });
  }
);

app.listen(PORT, () => {
  console.log(`App listenning on port ${PORT}`);
});
