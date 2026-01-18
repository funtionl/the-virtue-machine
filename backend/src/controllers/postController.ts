import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getClerkUserId } from "../middlewares/clerkAuth";
import { getDbUserOrThrow, virtueRewrite } from "./controllerHelpers";
import { env } from "../config/env";

/**
 * GET /posts
 * Public feed with cursor pagination.
 * Query:
 *  - cursor (optional): last post id from previous page
 *  - limit (optional): default 10, max 50
 */
export const listPosts = async (req: Request, res: Response) => {
  const limitRaw = req.query.limit as string | undefined;
  const cursor = req.query.cursor as string | undefined;

  const limit = Math.min(Math.max(Number(limitRaw ?? 10), 1), 50);

  // Try to get the current user for checking reactions
  let currentUserId: string | null = null;
  try {
    const clerkUserId = getClerkUserId(req);

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: clerkUserId },
        select: { id: true },
      });
      currentUserId = user?.id ?? null;
    }
  } catch {
    // User not authenticated, that's fine for public feed
  }

  const posts = await prisma.post.findMany({
    take: limit + 1, // fetch one extra to determine hasNextPage
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      imageUrl: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
      ...(currentUserId
        ? {
            reactions: {
              where: { userId: currentUserId },
              select: { storedType: true },
            },
          }
        : {}),
    },
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;

  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

  // Transform to include userReaction field
  const transformedItems = items.map((post) => ({
    ...post,
    likedByCurrentUser: post.reactions?.[0]?.storedType === "UP",
    reactions: undefined, // Remove the reactions array
  }));

  return res.json({
    items: transformedItems,
    pageInfo: {
      nextCursor,
      hasNextPage,
    },
  });
};

/**
 * GET /posts/:id
 * Public post detail (post + author + counts).
 * (We’ll add comments endpoint separately.)
 */
export const getPostById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;

  let currentUserId: string | null = null;
  try {
    const clerkUserId = getClerkUserId(req);

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: clerkUserId },
        select: { id: true },
      });
      currentUserId = user?.id ?? null;
    }
  } catch {
    // User not authenticated, that's fine for public feed
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      imageUrl: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
      ...(currentUserId
        ? {
            reactions: {
              where: { userId: currentUserId },
              select: { storedType: true },
            },
          }
        : {}),
    },
  });

  if (!post) return res.status(404).json({ message: "Post not found" });

  // Transform to include userReaction field
  const transformedPost = {
    ...post,
    likedByCurrentUser: post.reactions?.[0]?.storedType === "UP",
    reactions: undefined, // Remove the reactions array
  };
  return res.json(transformedPost);
};

/**
 * POST /posts
 * Auth required.
 * multipart form data: { content: string, image?: file }
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const clerkUserId = getClerkUserId(req);

    const dbUser = await getDbUserOrThrow(clerkUserId);

    const { content } = req.body as {
      content?: string;
    };
    const file = (req as any).file as Express.Multer.File | undefined;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const cleaned = await virtueRewrite(content);

    // Build imageUrl if file was uploaded
    let imageUrl: string | undefined = undefined;
    if (file) {
      // Generate the URL that the frontend can use to fetch the image
      imageUrl = `${env.apiBaseUrl}/uploads/${file.filename}`;
    }

    const created = await prisma.post.create({
      data: {
        authorId: dbUser.id,
        ...(imageUrl ? { imageUrl } : {}),
        content: cleaned,
      },
      select: {
        id: true,
        imageUrl: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });

    return res.status(201).json(created);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    return res.status(status).json({ message: err?.message ?? "Server error" });
  }
};

/**
 * PATCH /posts/:id
 * Auth required. Only author can edit.
 * body: { imageUrl?: string, content?: string }
 */
export const updatePost = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) return res.status(404).json({ message: "Post not found" });
    if (existing.authorId !== dbUser.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { imageUrl, content } = req.body as {
      imageUrl?: string;
      content?: string;
    };

    const data: { imageUrl?: string; content?: string } = {};

    if (typeof imageUrl === "string") {
      const trimmed = imageUrl.trim();
      if (!trimmed)
        return res.status(400).json({ message: "imageUrl cannot be empty" });
      data.imageUrl = trimmed;
    }

    if (typeof content === "string") {
      const trimmed = content.trim();
      if (!trimmed)
        return res.status(400).json({ message: "content cannot be empty" });
      data.content = await virtueRewrite(trimmed);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await prisma.post.update({
      where: { id },
      data,
      select: {
        id: true,
        imageUrl: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });

    return res.json(updated);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    return res.status(status).json({ message: err?.message ?? "Server error" });
  }
};

/**
 * DELETE /posts/:id
 * Auth required. Only author can delete.
 */
export const deletePost = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const existing = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existing) return res.status(404).json({ message: "Post not found" });
    if (existing.authorId !== dbUser.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.post.delete({ where: { id } });

    return res.status(204).send();
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    return res.status(status).json({ message: err?.message ?? "Server error" });
  }
};

/**
 * GET /posts/:id/comments
 * Public, cursor pagination.
 * Query:
 *  - cursor (optional): last comment id from previous page
 *  - limit (optional): default 20, max 100
 */
export const listCommentsForPost = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;
  const cursor = req.query.cursor as string | undefined;
  const limitRaw = req.query.limit as string | undefined;
  const limit = Math.min(Math.max(Number(limitRaw ?? 20), 1), 100);

  // Validate post exists (optional but nicer error)
  const postExists = await prisma.post.findUnique({
    where: { id: id },
    select: { id: true },
  });
  if (!postExists) return res.status(404).json({ message: "Post not found" });

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      postId: true,
      authorId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  const hasNextPage = comments.length > limit;
  const items = hasNextPage ? comments.slice(0, limit) : comments;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

  return res.json({
    items,
    pageInfo: { nextCursor, hasNextPage },
  });
};

/**
 * POST /posts/:id/comments
 * Auth required
 * body: { content: string }
 */
export const createCommentForPost = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const { content } = req.body as { content?: string };

    if (typeof content !== "string") {
      return res.status(400).json({ message: "content is required" });
    }
    const trimmed = content.trim();
    if (!trimmed)
      return res.status(400).json({ message: "content cannot be empty" });
    if (trimmed.length > 2000) {
      return res
        .status(400)
        .json({ message: "content too long (max 2000 chars)" });
    }

    const postExists = await prisma.post.findUnique({
      where: { id: id },
      select: { id: true },
    });
    if (!postExists) return res.status(404).json({ message: "Post not found" });

    const cleaned = await virtueRewrite(trimmed);

    const created = await prisma.comment.create({
      data: {
        postId: id,
        authorId: dbUser.id,
        content: cleaned,
      },
      select: {
        id: true,
        postId: true,
        authorId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return res.status(201).json({
      ...created,
      isAuthor: created.authorId === dbUser.id,
    });
  } catch (err: any) {
    return res
      .status(err?.statusCode ?? 500)
      .json({ message: err?.message ?? "Server error" });
  }
};

/**
 * POST /posts/:id/reactions
 * Auth required. Toggle thumbs up reaction.
 */
export const togglePostReaction = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id: postId } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user already has a reaction on this post
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: dbUser.id,
        },
      },
    });

    if (existing) {
      // If reaction exists, remove it
      await prisma.reaction.delete({
        where: {
          postId_userId: {
            postId,
            userId: dbUser.id,
          },
        },
      });
    } else {
      // If reaction doesn't exist, create it
      await prisma.reaction.create({
        data: {
          postId,
          userId: dbUser.id,
          storedType: "UP",
        },
      });
    }

    // Return updated post with counts
    const updated = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        imageUrl: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    return res.status(status).json({ message: err?.message ?? "Server error" });
  }
};
