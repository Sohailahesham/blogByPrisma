import { NextFunction, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import AppError from "../utils/appError";
import getPagination from "../utils/pagination";
import { getCategoryFilter } from "../utils/filter";

const prisma = new PrismaClient();

const createPost = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return next(new AppError("User not authenticated", 401));
  }

  const { title, content, category, tags } = req.body;

  const existingPost = await prisma.post.findFirst({
    where: {
      title,
      authorId: req.user.id,
    },
  });

  if (existingPost) {
    return next(
      new AppError("You already have a post with the same title", 409)
    );
  }

  // Normalize tag names if they exist
  let tagConnections: { id: string }[] = [];
  if (Array.isArray(tags)) {
    const normalizedTags = tags.map((tag: string) => tag.toLowerCase());

    // Find or create tags
    const connectedTags = await Promise.all(
      normalizedTags.map(async (tagName) => {
        const existingTag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (existingTag) return { id: existingTag.id };

        const newTag = await prisma.tag.create({
          data: { name: tagName },
        });

        return { id: newTag.id };
      })
    );

    tagConnections = connectedTags;
  }

  const newPost = await prisma.post.create({
    data: {
      title,
      content,
      category,
      author: { connect: { id: req.user.id } },
      tags: {
        connect: tagConnections,
      },
    },
    include: { tags: true }, // Optional: to return tags in response
  });

  res.status(201).json({
    status: "success",
    message: "Post added successfully",
    data: { post: newPost },
  });
};

const getAllUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.userId;
  const { page, limit, skip } = getPagination({
    page: typeof req.query.page === "string" ? req.query.page : "",
    limit: typeof req.query.limit === "string" ? req.query.limit : "",
  });
  const categoryStr =
    typeof req.query.category === "string" ? req.query.category : "";
  const category = getCategoryFilter(categoryStr, next);
  const search = (req.query.search as string)?.trim() || "";
  const published = req.query.published === "true" ? true : false;
  const filter: any = {
    OR: [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: search,
          mode: "insensitive",
        },
      },
    ],
    author: {
      id: userId, // Use the authenticated user's ID or the provided userId
    },
    published: true, // Only fetch published posts by default
  };
  if (categoryStr) {
    filter.category = category;
  }
  if (published) {
    filter.published = published;
  }

  // if (userId !== req.user.id) {
  //   filter.author.id = userId; // Use the authenticated user's I
  //   filter.published = true; // Allow both published and unpublished posts for the user
  // }
  const posts = await prisma.post.findMany({
    where: filter,
    orderBy: { published: "desc" },
    skip,
    take: limit,
  });
  if (!posts) {
    return next(new AppError("posts not found", 404));
  }

  const totalPosts = await prisma.post.count({
    where: filter,
  });
  const totalPages = Math.ceil(totalPosts / limit);
  const currentPage = Number(page);
  if (currentPage > totalPages && totalPages > 0) {
    return next(new AppError(`There are only ${totalPages} page(s)`, 404));
  }
  res.status(200).json({
    status: "success",
    totalPages,
    currentPage,
    totalPosts,
    message: "posts retreived successfully",
    data: { posts },
  });
};

const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  const postID = req.params.id;

  const post = await prisma.post.findUnique({
    where: {
      id: postID,
      published: true, // Ensure the post is published
    },
  });

  if (!post) {
    return next(new AppError("Post not found or not published yet", 404));
  }
  res.status(200).json({
    status: "success",
    message: `${post.title} post retreived successfully`,
    data: { post },
  });
};

const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  const postID = req.params.id;
  const { title, content, category } = req.body || {};

  const post = await prisma.post.findUnique({
    where: {
      id: postID,
      authorId: req.user.id,
    },
  });

  if (!post) {
    return next(new AppError("Post not found or you're not the author", 404));
  }

  const updatedPost = await prisma.post.update({
    where: {
      id: postID,
    },
    data: {
      title,
      content,
      category,
    },
  });
  res.status(200).json({
    status: "success",
    message: `${post.title} post updated successfully`,
    data: { post: updatedPost },
  });
};

const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return next(new AppError("User not authenticated", 401));
  }

  const postID = req.params.id;

  const post = await prisma.post.findUnique({
    where: {
      id: postID,
    },
  });

  if (!post || post.authorId !== req.user.id) {
    return next(new AppError("Post not found or you're not the author", 404));
  }

  await prisma.post.delete({
    where: {
      id: postID,
    },
  });

  res.status(200).json({
    status: "success",
    message: `${post.title} post deleted successfully`,
    data: null,
  });
};

const deleteAllPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.id) {
    return next(new AppError("User not authenticated", 401));
  }

  const result = await prisma.post.deleteMany({
    where: {
      authorId: req.user.id,
    },
  });

  if (result.count === 0) {
    return res.status(200).json({
      status: "success",
      message: "You had no posts to delete",
      data: null,
    });
  }
  res.status(200).json({
    status: "success",
    message: `All posts deleted successfully`,
    data: null,
  });
};

const getAllPublishedPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { page, limit, skip } = getPagination({
    page: typeof req.query.page === "string" ? req.query.page : "",
    limit: typeof req.query.limit === "string" ? req.query.limit : "",
  });
  const categoryStr =
    typeof req.query.category === "string" ? req.query.category : "";
  const category = getCategoryFilter(categoryStr, next);
  const search = (req.query.search as string)?.trim() || "";
  const filter: any = {
    published: true,
    OR: [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: search,
          mode: "insensitive",
        },
      },
    ],
  };
  if (categoryStr) {
    filter.category = category;
  }

  const posts = await prisma.post.findMany({
    where: filter,
    orderBy: { publishedAt: "desc" },
    skip,
    take: limit,
  });
  if (!posts) {
    return next(new AppError("posts not found", 404));
  }
  const totalPosts = await prisma.post.count({
    where: filter,
  });
  const totalPages = Math.ceil(totalPosts / limit);
  const currentPage = Number(page);
  if (currentPage > totalPages && totalPages > 0) {
    return next(new AppError(`There are only ${totalPages} page(s)`, 404));
  }
  res.status(200).json({
    status: "success",
    totalPages,
    currentPage,
    totalPosts,
    message: "posts retreived successfully",
    data: { posts },
  });
};

// for admin

const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, skip } = getPagination(
    req.query as { page: string; limit: string }
  );

  const category =
    typeof req.query.category === "string"
      ? getCategoryFilter(req.query.category, next)
      : undefined;
  const published =
    req.query.published === "true"
      ? true
      : req.query.published === "false"
      ? false
      : undefined;
  const search = (req.query.search as string)?.trim() || "";

  // Build dynamic filter
  const filter: any = {
    OR: [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: search,
          mode: "insensitive",
        },
      },
    ],
    published: published !== undefined ? published : true, // Default to true if not specified
  };
  if (category) filter.category = category;
  if (published !== undefined) filter.published = published;

  const total = await prisma.post.count({ where: filter });

  const posts = await prisma.post.findMany({
    where: filter,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const totalPages = Math.ceil(total / limit);
  const currentPage = Number(page);

  if (currentPage > totalPages && totalPages > 0) {
    return next(new AppError(`There are only ${totalPages} page(s)`, 404));
  }

  res.status(200).json({
    status: "success",
    message: "Filtered posts retrieved successfully",
    data: {
      currentPage,
      totalPages,
      totalPosts: total,
      posts,
    },
  });
};

const updatePublish = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const postId = req.params.id;
  const { published } = req.body;
  // Try to update the post only if it's unpublished
  const updatedPost = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      published,
      publishedAt: published === true ? new Date() : null, // Set publishedAt to current date if publishing, otherwise null
    },
  });
  if (!updatedPost) {
    return next(new AppError("Post not found or update failed", 404));
  }
  const post = await prisma.post.findUnique({ where: { id: postId } });
  res.status(200).json({
    status: "success",
    message: "Post published state updated successfully",
    data: { post },
  });
};

export {
  createPost,
  getAllUserPosts,
  getAllPublishedPosts,
  getPostById,
  updatePost,
  deletePost,
  deleteAllPosts,
  getAllPosts,
  updatePublish,
};
