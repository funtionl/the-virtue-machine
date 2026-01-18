import type { Request, Response } from "express";

import { clerkClient } from "@clerk/express";
import { prisma } from "../lib/prisma";
import { getClerkUserId } from "../middlewares/clerkAuth";
import { resolveAvatarUrl } from "../utils/avatar";

export const getMe = async (req: Request, res: Response) => {
  const clerkUserId = getClerkUserId(req);

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({
    ...user,
    avatarUrlResolved: resolveAvatarUrl({
      avatarUrl: user.avatarUrl,
      seed: user.clerkUserId,
    }),
  });
};

export const syncMe = async (req: Request, res: Response) => {
  const clerkUserId = getClerkUserId(req);

  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  // email
  const primaryEmailId = clerkUser.primaryEmailAddressId;
  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === primaryEmailId)
      ?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;

  if (!primaryEmail) {
    return res
      .status(400)
      .json({ message: "Clerk user has no email address." });
  }

  // username fallback: Clerk username -> "first last" -> email prefix -> clerkUserId
  const username =
    clerkUser.username?.trim() ||
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    primaryEmail.split("@")[0] ||
    clerkUserId;

  const avatarUrl = (clerkUser.imageUrl ?? "").trim(); // Clerk profile image

  const dbUser = await prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email: primaryEmail,
      username,
      avatarUrl: avatarUrl || "", // keep empty string if none
    },
    create: {
      clerkUserId,
      email: primaryEmail,
      username,
      avatarUrl: avatarUrl || "",
    },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.json({
    ...dbUser,
    avatarUrlResolved: resolveAvatarUrl({
      avatarUrl: dbUser.avatarUrl,
      seed: dbUser.clerkUserId,
    }),
  });
};

export const updateMe = async (req: Request, res: Response) => {
  const clerkUserId = getClerkUserId(req);

  const { username, avatarUrl } = req.body as {
    username?: string;
    avatarUrl?: string;
  };

  const data: { username?: string; avatarUrl?: string } = {};

  if (typeof username === "string") {
    const trimmed = username.trim();
    if (!trimmed)
      return res.status(400).json({ message: "username cannot be empty" });
    data.username = trimmed;
  }

  if (typeof avatarUrl === "string") {
    data.avatarUrl = avatarUrl.trim(); // allow "" to clear and use fallback
  }

  const updated = await prisma.user.update({
    where: { clerkUserId },
    data,
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.json({
    ...updated,
    avatarUrlResolved: resolveAvatarUrl({
      avatarUrl: updated.avatarUrl,
      seed: updated.clerkUserId,
    }),
  });
};

export const getUserProfile = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    ...user,
    avatarUrlResolved: resolveAvatarUrl({
      avatarUrl: user.avatarUrl,
      seed: user.id,
    }),
  });
};
