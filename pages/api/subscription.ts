import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true, subscriptionStatus: true, subscriptionId: true } });
  return res.json({ plan: user?.plan || "free", status: user?.subscriptionStatus || "inactive", subscriptionId: user?.subscriptionId });
}