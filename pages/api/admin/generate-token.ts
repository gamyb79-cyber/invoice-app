import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const ADMIN_EMAILS = ["ga.myb79@gmail.com"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) return res.status(403).json({ error: "Forbidden" });

  const { type } = req.body;
  if (type !== "monthly" && type !== "lifetime") return res.status(400).json({ error: "Invalid type" });

  const prefix = type === "monthly" ? "MONTHLY" : "LIFETIME";
  const code = crypto.randomBytes(6).toString("hex").toUpperCase();
  const token = `GOGO-${prefix}-${code}`;

  await prisma.activationToken.create({
    data: {
      token,
      type,
      createdBy: session.user.id,
    },
  });

  return res.json({ token, type });
}
