import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { method } = req;

  if (method === "GET") {
    const clients = await prisma.client.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
    return res.json(clients);
  }

  if (method === "POST") {
    const body = req.body;
    const client = await prisma.client.create({
      data: {
        userId: session.user.id, name: body.name, email: body.email || "", phone: body.phone || "",
        address: body.address || "", city: body.city || "", state: body.state || "", zip: body.zip || "", country: body.country || "",
      },
    });
    return res.json(client);
  }

  if (method === "PUT") {
    const { id, name, email, phone, address, city, state, zip, country } = req.body;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const existing = await prisma.client.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const client = await prisma.client.update({
      where: { id },
      data: { name, email: email || "", phone: phone || "", address: address || "", city: city || "", state: state || "", zip: zip || "", country: country || "" },
    });
    return res.json(client);
  }

  if (method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const existing = await prisma.client.findFirst({ where: { id: id as string, userId: session.user.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    await prisma.client.delete({ where: { id: id as string } });
    return res.json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}