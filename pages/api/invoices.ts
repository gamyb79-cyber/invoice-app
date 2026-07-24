import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getInvoiceLimit(plan: string): number | null {
  switch (plan) {
    case "free": return 3;
    case "friend": return 20;
    case "trial": return null;
    case "pro": return null;
    default: return 3;
  }
}

async function generateInvoiceNumber(userId: string): Promise<string> {
  const business = await prisma.businessInfo.findUnique({ where: { userId } });
  const prefix = business?.invoicePrefix || "INV";
  const nextNum = business?.nextInvoiceNumber || 1001;
  const number = `${prefix}-${String(nextNum).padStart(4, "0")}`;
  await prisma.businessInfo.upsert({
    where: { userId },
    update: { nextInvoiceNumber: nextNum + 1 },
    create: { userId, nextInvoiceNumber: nextNum + 1 },
  });
  return number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { method } = req;

  if (method === "GET") {
    const { id } = req.query;
    if (id) {
      const invoice = await prisma.invoice.findFirst({ where: { id: id as string, userId: session.user.id }, include: { lineItems: true } });
      if (!invoice) return res.status(404).json({ error: "Not found" });
      return res.json(invoice);
    }
    const invoices = await prisma.invoice.findMany({ where: { userId: session.user.id }, include: { lineItems: true }, orderBy: { createdAt: "desc" } });
    return res.json(invoices);
  }

  if (method === "POST") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    const limit = getInvoiceLimit(user?.plan || "free");
    if (limit !== null) {
      const count = await prisma.invoice.count({ where: { userId: session.user.id } });
      if (count >= limit) return res.status(403).json({ error: "Invoice limit reached for your plan. Upgrade for unlimited." });
    }
    const { number, clientId, clientName, issueDate, dueDate, status, lineItems, taxRate, discount, notes, currency } = req.body;
    const invoiceNumber = number || await generateInvoiceNumber(session.user.id);
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber, userId: session.user.id, clientId: clientId || null, clientName: clientName || "",
        issueDate, dueDate, status: status || "draft", taxRate: taxRate || 0, discount: discount || 0,
        notes: notes || "", currency: currency || "USD",
        lineItems: { create: (lineItems || []).map((item: any) => ({ description: item.description || "", quantity: item.quantity || 1, rate: item.rate || 0 })) },
      },
      include: { lineItems: true },
    });
    return res.json(invoice);
  }

  if (method === "PUT") {
    const { id, number, clientId, clientName, issueDate, dueDate, status, lineItems, taxRate, discount, notes, currency } = req.body;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const existing = await prisma.invoice.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    await prisma.lineItem.deleteMany({ where: { invoiceId: id } });
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        number, clientId: clientId || null, clientName: clientName || "",
        issueDate, dueDate, status, taxRate: taxRate || 0, discount: discount || 0,
        notes: notes || "", currency: currency || "USD",
        lineItems: { create: (lineItems || []).map((item: any) => ({ description: item.description || "", quantity: item.quantity || 1, rate: item.rate || 0 })) },
      },
      include: { lineItems: true },
    });
    return res.json(invoice);
  }

  if (method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const existing = await prisma.invoice.findFirst({ where: { id: id as string, userId: session.user.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    await prisma.lineItem.deleteMany({ where: { invoiceId: id as string } });
    await prisma.invoice.delete({ where: { id: id as string } });
    return res.json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}