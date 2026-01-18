import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getClerkUserId } from "../middlewares/clerkAuth";
import { getDbUserOrThrow, virtueRewrite } from "./controllerHelpers";

/**
 * PATCH /comments/:id
 * Auth required, only author
 * body: { content: string }
 */
export const updateComment = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const existing = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!existing)
      return res.status(404).json({ message: "Comment not found" });
    if (existing.authorId !== dbUser.id)
      return res.status(403).json({ message: "Forbidden" });

    const { content } = req.body as { content?: string };
    if (typeof content !== "string")
      return res.status(400).json({ message: "content is required" });

    const trimmed = content.trim();
    if (!trimmed)
      return res.status(400).json({ message: "content cannot be empty" });
    if (trimmed.length > 2000) {
      return res
        .status(400)
        .json({ message: "content too long (max 2000 chars)" });
    }

    const cleaned = await virtueRewrite(trimmed);

    const updated = await prisma.comment.update({
      where: { id },
      data: { content: cleaned },
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

    return res.json({
      ...updated,
      isAuthor: updated.authorId === dbUser.id,
    });
  } catch (err: any) {
    return res
      .status(err?.statusCode ?? 500)
      .json({ message: err?.message ?? "Server error" });
  }
};

/**
 * DELETE /comments/:id
 * Auth required, only author
 */
export const deleteComment = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const clerkUserId = getClerkUserId(req);
    const dbUser = await getDbUserOrThrow(clerkUserId);

    const existing = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!existing)
      return res.status(404).json({ message: "Comment not found" });
    if (existing.authorId !== dbUser.id)
      return res.status(403).json({ message: "Forbidden" });

    await prisma.comment.delete({ where: { id } });

    return res.status(204).send();
  } catch (err: any) {
    return res
      .status(err?.statusCode ?? 500)
      .json({ message: err?.message ?? "Server error" });
  }
};
