import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GOGO-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(401).json({ error: "User not found" });

  if (req.method === "GET") {
    const referrals = await prisma.referral.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: referrals.length,
      signedUp: referrals.filter((r) => r.status === "signed_up").length,
      activated: referrals.filter((r) => r.status === "activated").length,
    };

    let existingCode = referrals[0]?.code;
    if (!existingCode) {
      existingCode = generateCode();
      await prisma.referral.create({
        data: { userId: user.id, code: existingCode, status: "active" },
      });
    }

    return res.json({ code: existingCode, stats, referrals });
  }

  if (req.method === "POST") {
    const { referredEmail } = req.body;

    let code = (await prisma.referral.findFirst({ where: { userId: user.id } }))?.code;
    if (!code) {
      code = generateCode();
      await prisma.referral.create({
        data: { userId: user.id, code, status: "active" },
      });
    }

    if (referredEmail) {
      await prisma.referral.create({
        data: {
          userId: user.id,
          code,
          referredEmail,
          status: "pending",
        },
      });
    }

    return res.json({ code });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
