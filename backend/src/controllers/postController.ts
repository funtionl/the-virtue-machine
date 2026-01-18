import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getClerkUserId } from "../middlewares/clerkAuth";

/**
 * Replace this later with your real "Virtue AI" function.
 */
async function virtueRewrite(text: string): Promise<string> {
  // TODO: call your AI here
  return text.trim();
}

async function getDbUserOrThrow(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, clerkUserId: true },
  });

  if (!user) {
    const err = new Error("User not found. Call /users/sync first.");
    (err as any).statusCode = 404;
    throw err;
  }

  return user;
}

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
    },
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;

  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

  return res.json({
    items,
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
    },
  });

  if (!post) return res.status(404).json({ message: "Post not found" });

  return res.json(post);
};

/**
 * POST /posts
 * Auth required.
 * body: { imageUrl: string, content: string }
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const { imageUrl, content } = req.body as {
      imageUrl?: string;
      content?: string;
    };

    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      return res.status(400).json({ message: "imageUrl is required" });
    }
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const cleaned = await virtueRewrite(content);

    const created = await prisma.post.create({
      data: {
        authorId: dbUser.id,
        imageUrl: imageUrl.trim(),
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
