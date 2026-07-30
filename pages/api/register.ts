import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const emailLower = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: emailLower, hashedPassword },
  });

  return res.json({ user: { id: user.id, name: user.name, email: user.email } });
}
