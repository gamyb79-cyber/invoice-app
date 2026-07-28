import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_EMAILS = ["ga.myb79@gmail.com"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const userCount = await prisma.user.count();

  if (userCount > 0) {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(403).json({ error: "Registration is closed. Only the admin can create new accounts." });
    const adminUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
    if (!adminUser?.email || !ADMIN_EMAILS.includes(adminUser.email)) {
      return res.status(403).json({ error: "Registration is closed. Only the admin can create new accounts." });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: "An account with this email already exists" });
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, hashedPassword } });
  return res.json({ user: { id: user.id, name: user.name, email: user.email } });
}
