import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: "All fields are required" });
  if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "No account found with that email" });
  if (!user.resetToken) return res.status(400).json({ error: "No reset code found. Request a new one." });
  if (user.resetToken !== code.trim()) return res.status(400).json({ error: "Invalid reset code. Expected: " + user.resetToken + " Got: " + code });
  if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) return res.status(400).json({ error: "Reset code has expired. Request a new one." });

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword, resetToken: null, resetTokenExpiry: null },
  });

  return res.json({ message: "Password reset successful! You can now sign in." });
}