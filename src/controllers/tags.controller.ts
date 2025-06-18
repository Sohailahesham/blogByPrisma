import e, { NextFunction, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import AppError from "../utils/appError";
import getPagination from "../utils/pagination";
import { getCategoryFilter } from "../utils/filter";

const prisma = new PrismaClient();

const getAllTags = async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, skip } = getPagination({
    page: typeof req.query.page === "string" ? req.query.page : "1",
    limit: typeof req.query.limit === "string" ? req.query.limit : "10",
  });
  const search = (req.query.search as string)?.trim() || "";
  const filter: any = {
    name: {
      contains: search,
      mode: "insensitive",
    },
  };

  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    where: {
      name: {
        contains: search,
        mode: "insensitive",
      },
    },
    orderBy: { posts: { _count: "desc" } },
    take: limit,
    skip,
  });

  if (!tags) {
    return next(new AppError("Tags not found", 404));
  }
  const totalTags = await prisma.tag.count({
    where: filter,
  });
  const totalPages = Math.ceil(totalTags / limit);
  const currentPage = Number(page);
  if (currentPage > totalPages && totalPages > 0) {
    return next(new AppError(`Only ${totalPages} page(s) available`, 404));
  }

  res.status(200).json({
    status: "success",
    totalPages,
    currentPage,
    totalTags,
    message: "Tags retrieved successfully",
    data: { tags },
  });
};

const getTagById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  let whereClause: any = {};
  if (req.user.role === Role.USER) {
    whereClause.published = true;
  }

  const tag = await prisma.tag.findUnique({
    where: {
      id,
    },
    include: {
      posts: {
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          createdAt: true,
          updatedAt: true,
        },
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
  if (!tag) {
    return next(new AppError("Tag not found", 404));
  }
  const usedIn = tag.posts.length;
  res.status(200).json({
    status: "success",
    message: "Tag retrieved successfully",
    data: { tag, usedIn },
  });
};

const getTagByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name } = req.params;
  if (!name) {
    return next(new AppError("Tag name is required", 400));
  }
  const normalizedName = name.toLowerCase();

  let whereClause: any = {};
  if (req.user.role === Role.USER) {
    whereClause.published = true;
  }

  const tag = await prisma.tag.findUnique({
    where: {
      name: normalizedName,
    },
    include: {
      posts: {
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          createdAt: true,
          updatedAt: true,
        },
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!tag) {
    return next(new AppError("Tag not found", 404));
  }
  const usedIn = tag.posts.length;
  res.status(200).json({
    status: "success",
    message: "Tag retrieved successfully",
    data: { tag, usedIn },
  });
};

// for admin
const createTag = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  const normalizedName = name.toLowerCase();
  const existingTag = await prisma.tag.findUnique({
    where: {
      name: normalizedName,
    },
  });

  if (existingTag) {
    return next(new AppError("Tag already exists", 400));
  }
  const tag = await prisma.tag.create({
    data: {
      name: normalizedName,
    },
  });

  res.status(201).json({
    status: "success",
    message: "Tag created successfully",
    data: { tag },
  });
};

const updateTag = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name } = req.body || {};
  let normalizedName;
  if (typeof name === "string") {
    normalizedName = name.toLowerCase();
  }
  const existingTag = await prisma.tag.findUnique({
    where: {
      id,
    },
  });
  if (!existingTag) {
    return next(new AppError("Tag not found", 404));
  }
  const tagWithSameName = await prisma.tag.findUnique({
    where: {
      name: normalizedName || existingTag.name.toLowerCase(),
    },
  });
  if (tagWithSameName && tagWithSameName.id !== id) {
    return next(new AppError("Tag with this name already exists", 400));
  }
  const updatedTag = await prisma.tag.update({
    where: {
      id,
    },
    data: {
      name: normalizedName,
    },
  });
  res.status(200).json({
    status: "success",
    message: "Tag updated successfully",
    data: { updatedTag },
  });
};

const deleteTag = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const tag = await prisma.tag.findUnique({
    where: {
      id,
    },
  });
  if (!tag) {
    return next(new AppError("Tag not found", 404));
  }
  const posts = await prisma.post.findMany({
    where: {
      tags: {
        some: {
          id,
        },
      },
    },
  });
  if (posts.length > 0) {
    return next(
      new AppError(
        "Cannot delete tag because it is associated with existing posts",
        400
      )
    );
  }
  await prisma.tag.delete({
    where: {
      id,
    },
  });
  res.status(204).json({
    status: "success",
    message: "Tag deleted successfully",
    data: null,
  });
};

export {
  getAllTags,
  getTagById,
  getTagByName,
  createTag,
  updateTag,
  deleteTag,
};
