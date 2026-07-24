import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ message: "If an account exists, your reset code is shown below." });

  const resetCode = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: resetCode, resetTokenExpiry: expiry },
  });

  return res.json({ message: "If an account exists, your reset code is shown below.", code: resetCode });
}