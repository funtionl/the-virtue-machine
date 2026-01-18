import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getClerkUserId } from "../middlewares/clerkAuth";
import { getDbUserOrThrow } from "./controllerHelpers";

type Body = { type?: "UP" | "DOWN" };

/**
 * GET /posts/:id/reaction
 * Auth required
 * Returns whether current user reacted to this post.
 */
export const getMyReactionForPost = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const reaction = await prisma.reaction.findUnique({
      where: {
        // Prisma auto-generates this name from @@unique([postId, userId])
        postId_userId: { postId: id, userId: dbUser.id },
      },
      select: {
        postId: true,
        userId: true,
        storedType: true,
        createdAt: true,
      },
    });

    return res.json({
      hasReacted: !!reaction,
      reaction: reaction ?? null,
    });
  } catch (err: any) {
    return res
      .status(err?.statusCode ?? 500)
      .json({ message: err?.message ?? "Server error" });
  }
};

/**
 * PUT /posts/:id/reaction
 * Auth required
 * body: { type: "UP" | "DOWN" }
 *
 * Your rule: DOWN becomes UP in DB (you can animate it on frontend).
 */
export const upsertReactionForPost = async (
  req: Request<{ id: string }, any, Body>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const { type } = req.body ?? {};
    if (type !== "UP" && type !== "DOWN") {
      return res.status(400).json({ message: `type must be "UP" or "DOWN"` });
    }

    // Always store UP (virtue machine magic)
    const storedType = "UP" as const;

    // Optional: verify post exists (nicer error)
    const postExists = await prisma.post.findUnique({
      where: { id: id },
      select: { id: true },
    });
    if (!postExists) return res.status(404).json({ message: "Post not found" });

    const reaction = await prisma.reaction.upsert({
      where: {
        postId_userId: { postId: id, userId: dbUser.id },
      },
      update: {
        storedType,
      },
      create: {
        postId: id,
        userId: dbUser.id,
        storedType,
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        storedType: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      clickedType: type,
      storedType: reaction.storedType,
      reaction,
    });
  } catch (err: any) {
    return res
      .status(err?.statusCode ?? 500)
      .json({ message: err?.message ?? "Server error" });
  }
};

/**
 * DELETE /posts/:id/reaction
 * Auth required
 * Removes current user's reaction on the post
 */
export const deleteMyReactionForPost = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    await prisma.reaction.deleteMany({
      where: { postId: id, userId: dbUser.id },
    });

    return res.status(204).send();
  } catch (err: any) {
    return res
      .status(err?.statusCode ?? 500)
      .json({ message: err?.message ?? "Server error" });
  }
};
