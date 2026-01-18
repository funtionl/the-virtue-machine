import { prisma } from "../lib/prisma";

/**
 * Replace this later with your real "Virtue AI" function.
 */
export async function virtueRewrite(text: string): Promise<string> {
  // TODO: call your AI here
  return text.trim();
}

export async function getDbUserOrThrow(clerkUserId: string) {
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
