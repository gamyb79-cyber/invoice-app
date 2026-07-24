import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Please enter a token" });

  const t = token.toUpperCase().trim();
  let plan = "";
  let message = "";

  if (t.startsWith("INVPRO-MONTHLY-")) {
    plan = "pro";
    message = "Pro activated for 1 month!";
  } else if (t.startsWith("INVPRO-LIFETIME-")) {
    plan = "pro";
    message = "Lifetime Pro access unlocked!";
  } else {
    return res.status(400).json({ error: "Invalid token. Please check and try again." });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { plan, subscriptionStatus: "active", subscriptionId: "token_" + t },
  });

  return res.json({ success: true, message });
}