import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user) return res.status(403).json({ error: "Unauthorized" });

  const { type } = req.body;
  const prefix = type === "monthly" ? "MONTHLY" : type === "lifetime" ? "LIFETIME" : "TOKEN";
  const code = crypto.randomBytes(6).toString("hex").toUpperCase();
  const token = `INVPRO-${prefix}-${code}`;

  return res.json({ token, type });
}