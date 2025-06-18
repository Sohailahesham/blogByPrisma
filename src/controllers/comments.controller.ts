import { NextFunction, Request, Response } from "express";
import { Prisma, PrismaClient, Role } from "@prisma/client";
import AppError from "../utils/appError";
import getPagination from "../utils/pagination";

const prisma = new PrismaClient();

const addComment = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return next(new AppError("User not authenticated", 401));
  }
  const postId = req.params.id;
  const { content } = req.body;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || !post.published) {
    return next(new AppError("Post not found or not published", 404));
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      post: {
        connect: {
          id: postId,
          published: true,
        },
      },
      author: {
        connect: {
          id: req.user.id,
        },
      },
    },
  });
  if (!comment) {
    return next(new AppError("Failed to add comment", 500));
  }
  res.status(201).json({
    status: "success",
    message: "Comment added successfully",
    data: {
      comment,
    },
  });
};

const getAllApprovedCommentsOfPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const postId = req.params.id;
  const { page, limit, skip } = getPagination({
    page: req.query.page as string,
    limit: req.query.limit as string,
  });

  const post = await prisma.post.findUnique({
    where: {
      id: postId,
      published: true,
    },
  });
  if (!post) {
    return next(new AppError("Post not found or not published yet", 404));
  }

  const postComments = await prisma.comment.findMany({
    where: {
      postId,
      approved: true,
    },
    include: {
      post: true,
    },
    skip,
    take: limit,
  });
  if (postComments.length === 0) {
    return next(new AppError("No comments found for this post", 404));
  }
  res.status(200).json({
    status: "success",
    message: "Comments retrieved successfully",
    data: {
      comments: postComments,
    },
  });
};

const getAllUserComments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.id) {
    return next(new AppError("User not authenticated", 401));
  }

  let userId = req.user.id;
  if (req.originalUrl.startsWith("/api/comments")) {
    userId = req.user.id;
  } else if (req.originalUrl.startsWith("/api/admin")) {
    userId = req.params.id;
  }

  const { page, limit, skip } = getPagination({
    page: req.query.page as string,
    limit: req.query.limit as string,
  });
  const approved =
    req.query.approved?.toString().toLowerCase() === "true"
      ? true
      : req.query.approved?.toString().toLowerCase() === "false"
      ? false
      : undefined;

  const whereClause: any = {
    authorId: userId,
  };

  if (approved !== undefined) {
    whereClause.approved = approved;
  }

  const userComments = await prisma.comment.findMany({
    where: whereClause,
    include: {
      post: true,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  if (userComments.length === 0) {
    return next(new AppError("No comments found for this user", 404));
  }
  const totalComments = await prisma.comment.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalComments / limit);
  const currentPage = Number(page);
  if (currentPage > totalPages && totalPages > 0) {
    return next(new AppError(`There are only ${totalPages} page(s)`, 404));
  }
  res.status(200).json({
    status: "success",
    totalPages,
    currentPage,
    totalComments,
    message: "Comments retrieved successfully",
    data: {
      comments: userComments,
    },
  });
};

const getCommentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;

  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      post: true,
    },
  });
  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }
  if (!comment.approved) {
    if (comment.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
      return next(new AppError("Comment not approved yet", 401));
    }
  }
  res.status(200).json({
    status: "success",
    message: "Comment retrieved successfully",
    data: {
      comment,
    },
  });
};

const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;
  const { content } = req.body || "";

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment || existingComment.authorId !== req.user.id) {
    return next(new AppError("Comment not found or unauthorized", 404));
  }

  const comment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      content,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Comment updated successfully",
    data: {
      comment,
    },
  });
};

const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment || existingComment.authorId !== req.user.id) {
    return next(new AppError("Comment not found or unauthorized", 404));
  }

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });

  res.status(204).json({
    status: "success",
    message: "Comment deleted successfully",
    data: null,
  });
};

// for admin
const getAllCommentsOfPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const postId = req.params.id;

  const post = await prisma.post.findUnique({
    where: { id: postId, published: true },
  });
  if (!post) {
    return next(new AppError("Post not found or not published", 404));
  }
  // console.log("req.user", req.user);
  // console.log("post.authorId", post.authorId);

  if (req.user.role !== "ADMIN" && post.authorId !== req.user.id) {
    // return res.status(308).redirect("/api/posts/" + postId + "/comments");
    return next(
      new AppError("Unauthorized to view comments of this post", 403)
    );
  }
  const { page, limit, skip } = getPagination({
    page: req.query.page as string,
    limit: req.query.limit as string,
  });
  const approved =
    req.query.approved?.toString().toLowerCase() === "true"
      ? true
      : req.query.approved?.toString().toLowerCase() === "false"
      ? false
      : undefined;

  const commentUserEmail = req.query.commentUserEmail as string;

  const whereClause: Prisma.CommentWhereInput = {
    postId,
  };
  if (approved !== undefined) {
    whereClause.approved = approved;
  }
  if (commentUserEmail) {
    whereClause.author = {
      email: {
        contains: commentUserEmail,
        mode: "insensitive",
      },
    };
  }

  const comments = await prisma.comment.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      approved: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
          authorId: true,
          published: true,
        },
      },
    },
  });
  if (comments.length === 0) {
    return next(new AppError("No comments found", 404));
  }
  const totalComments = await prisma.comment.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalComments / limit);
  const currentPage = Number(page);
  if (currentPage > totalPages && totalPages > 0) {
    return next(new AppError(`There are only ${totalPages} page(s)`, 404));
  }
  res.status(200).json({
    status: "success",
    totalPages,
    currentPage,
    totalComments,
    message: "Comments retrieved successfully",
    data: {
      comments,
    },
  });
};

const approveComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    return next(new AppError("Comment not found", 404));
  }
  if (existingComment.approved) {
    return next(new AppError("Comment already approved", 400));
  }

  const comment = await prisma.comment.update({
    where: {
      id: commentId,
    },
    data: {
      approved: true,
    },
  });

  res.status(200).json({
    status: "success",
    message: "Comment approved successfully",
    data: {
      comment,
    },
  });
};

export {
  addComment,
  getAllApprovedCommentsOfPost,
  getAllUserComments,
  getCommentById,
  updateComment,
  deleteComment,
  getAllCommentsOfPost,
  approveComment,
};
