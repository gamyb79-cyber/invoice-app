import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    let info = await prisma.businessInfo.findUnique({ where: { userId: session.user.id } });
    if (!info) {
      info = await prisma.businessInfo.create({ data: { userId: session.user.id } });
    }
    return res.json(info);
  }

  if (req.method === "POST") {
    const data = req.body;
    const customStatuses = Array.isArray(data.customStatuses) ? JSON.stringify(data.customStatuses) : data.customStatuses || "[]";
    const info = await prisma.businessInfo.upsert({
      where: { userId: session.user.id },
      update: {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        country: data.country || "",
        taxId: data.taxId || "",
        logo: data.logo || "",
        customStatuses,
        defaultTaxRate: data.defaultTaxRate || 0,
        defaultCurrency: data.defaultCurrency || "USD",
        invoicePrefix: data.invoicePrefix || "INV",
        nextInvoiceNumber: data.nextInvoiceNumber || 1001,
      },
      create: {
        userId: session.user.id,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zip: data.zip || "",
        country: data.country || "",
        taxId: data.taxId || "",
        logo: data.logo || "",
        customStatuses,
        defaultTaxRate: data.defaultTaxRate || 0,
        defaultCurrency: data.defaultCurrency || "USD",
        invoicePrefix: data.invoicePrefix || "INV",
        nextInvoiceNumber: data.nextInvoiceNumber || 1001,
      },
    });
    return res.json(info);
  }

  res.status(405).json({ error: "Method not allowed" });
}