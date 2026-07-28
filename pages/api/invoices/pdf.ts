import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing invoice ID" });

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!invoice || invoice.userId !== session.user.id) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  const business = await prisma.businessInfo.findUnique({ where: { userId: session.user.id } });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const currencySymbols: Record<string, string> = { USD: "$", ZAR: "R", EUR: "€", GBP: "£" };
  const sym = currencySymbols[invoice.currency] || invoice.currency + " ";
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`;

  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.text("INVOICE", 20, y);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(invoice.number, 20, y + 8);
  y += 8;

  if (business?.name) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(business.name, pageWidth - 20, 20, { align: "right" });
    let bizY = 26;
    if (business.email) { doc.text(business.email, pageWidth - 20, bizY, { align: "right" }); bizY += 5; }
    if (business.phone) { doc.text(business.phone, pageWidth - 20, bizY, { align: "right" }); bizY += 5; }
    const addr = [business.address, business.city, business.state, business.zip, business.country].filter(Boolean).join(", ");
    if (addr) { doc.text(addr, pageWidth - 20, bizY, { align: "right" }); bizY += 5; }
    if (business.taxId) { doc.text(`Tax ID: ${business.taxId}`, pageWidth - 20, bizY, { align: "right" }); }
  }

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Bill To:", 20, y);
  y += 5;
  doc.setTextColor(30, 30, 30);
  doc.setFont(undefined as any, "bold");
  doc.text(invoice.clientName || "No client", 20, y);
  doc.setFont(undefined as any, "normal");
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Issue Date: ${invoice.issueDate}`, 20, y);
  doc.text(`Due Date: ${invoice.dueDate}`, 90, y);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 20, y, { align: "right" });
  y += 10;

  doc.setDrawColor(220, 220, 220);
  doc.line(20, y, pageWidth - 20, y);
  y += 5;

  const colX = [20, 110, 140, 170];
  doc.setFont(undefined as any, "bold");
  doc.text("Description", colX[0], y);
  doc.text("Qty", colX[1], y, { align: "right" });
  doc.text("Rate", colX[2], y, { align: "right" });
  doc.text("Amount", colX[3], y, { align: "right" });
  doc.setFont(undefined as any, "normal");
  y += 3;
  doc.line(20, y, pageWidth - 20, y);
  y += 5;

  for (const item of invoice.lineItems) {
    doc.text(item.description || "-", colX[0], y);
    doc.text(String(item.quantity), colX[1], y, { align: "right" });
    doc.text(fmt(item.rate), colX[2], y, { align: "right" });
    doc.text(fmt(item.quantity * item.rate), colX[3], y, { align: "right" });
    y += 6;
    doc.setDrawColor(240, 240, 240);
    doc.line(20, y - 3, pageWidth - 20, y - 3);
  }

  y += 5;
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * invoice.taxRate / 100;
  const total = subtotal + taxAmount - invoice.discount;

  doc.setFont(undefined as any, "normal");
  doc.text("Subtotal:", 130, y);
  doc.text(fmt(subtotal), pageWidth - 20, y, { align: "right" });
  y += 6;

  if (invoice.taxRate > 0) {
    doc.text(`Tax (${invoice.taxRate}%):`, 130, y);
    doc.text(fmt(taxAmount), pageWidth - 20, y, { align: "right" });
    y += 6;
  }
  if (invoice.discount > 0) {
    doc.text("Discount:", 130, y);
    doc.text(`-${fmt(invoice.discount)}`, pageWidth - 20, y, { align: "right" });
    y += 6;
  }

  doc.setDrawColor(79, 70, 229);
  doc.line(130, y, pageWidth - 20, y);
  y += 5;
  doc.setFont(undefined as any, "bold");
  doc.setFontSize(13);
  doc.text("Total:", 130, y);
  doc.text(fmt(total), pageWidth - 20, y, { align: "right" });
  y += 12;

  if (invoice.notes) {
    doc.setFont(undefined as any, "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Notes:", 20, y);
    y += 5;
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(noteLines, 20, y);
  }

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.number}.pdf"`);
  res.send(pdfBuffer);
}
