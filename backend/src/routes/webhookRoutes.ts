import { Router } from "express";
import { verifyWebhook } from "@clerk/express/webhooks";
import express from "express";
import prisma from "../prisma/client";

const router = Router();

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserPayload = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string | null;
  profile_image_url?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
};

const getPrimaryEmail = (data: ClerkUserPayload): string | null => {
  const emails = data.email_addresses ?? [];
  if (emails.length === 0) {
    return null;
  }
  const primaryId = data.primary_email_address_id;
  const primary = primaryId
    ? emails.find((email) => email.id === primaryId)
    : undefined;
  return (primary ?? emails[0]).email_address;
};

const buildUsername = (data: ClerkUserPayload, email: string): string => {
  if (data.username && data.username.trim().length > 0) {
    return data.username.trim();
  }

  const name = [data.first_name, data.last_name]
    .filter((part) => part && part.trim().length > 0)
    .join(" ")
    .trim();

  if (name.length > 0) {
    return name;
  }

  const atIndex = email.indexOf("@");
  return atIndex > 0 ? email.slice(0, atIndex) : email;
};

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const evt = await verifyWebhook(req);

      const eventType = evt.type;

      if (eventType !== "user.created") {
        return res.send("Webhook received");
      }

      const data = evt.data as ClerkUserPayload;
      const email = getPrimaryEmail(data);

      if (!email) {
        console.warn("Clerk webhook missing email for user", data.id);
        return res.status(400).send("Missing email address");
      }

      const username = buildUsername(data, email);
      const avatarUrl =
        (data.image_url ?? data.profile_image_url ?? "").trim() || "";

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ clerkUserId: data.id }, { email }],
        },
      });

      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            clerkUserId: data.id,
            email,
            username,
            avatarUrl,
          },
        });
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            clerkUserId: data.id,
            email,
            username,
            avatarUrl,
          },
        });
      }

      return res.send("Webhook received");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).send("Error verifying webhook");
    }
  },
);

export default router;
