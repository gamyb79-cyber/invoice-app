import { Invoice, Client } from "./types";

export interface ClientRisk {
  clientId: string;
  clientName: string;
  score: "low" | "medium" | "high";
  label: string;
  color: string;
  avgDaysToPay: number;
  overdueRate: number;
  totalInvoices: number;
  reason: string;
}

export interface CashFlowForecast {
  month: string;
  label: string;
  predicted: number;
  confidence: "high" | "medium" | "low";
  basedOn: number;
}

export interface RevenueAnomaly {
  month: string;
  amount: number;
  expected: number;
  deviation: number;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface PaymentReminder {
  type: "gentle" | "firm" | "urgent" | "final";
  subject: string;
  message: string;
  channel: "email" | "whatsapp";
}

function calcTotal(i: Invoice): number {
  const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
  return sub + sub * (i.taxRate / 100) - i.discount;
}

function daysBetween(d1: string, d2: string): number {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getMonthKey(dateStr: string): string {
  return dateStr?.slice(0, 7) || "";
}

// ─── Client Risk Scoring ───
export function calculateClientRisk(invoices: Invoice[], clients: Client[]): ClientRisk[] {
  const clientInvoices = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const cid = inv.clientId || "_none";
    if (!clientInvoices.has(cid)) clientInvoices.set(cid, []);
    clientInvoices.get(cid)!.push(inv);
  }

  const results: ClientRisk[] = [];

  for (const client of clients) {
    const invs = clientInvoices.get(client.id) || [];
    if (invs.length === 0) continue;

    const paidInvs = invs.filter((i) => i.status === "paid");
    const overdueInvs = invs.filter((i) => i.status === "overdue");
    const overdueRate = invs.length > 0 ? overdueInvs.length / invs.length : 0;

    let avgDaysToPay = 0;
    if (paidInvs.length > 0) {
      const totalDays = paidInvs.reduce((sum, inv) => {
        return sum + Math.max(0, daysBetween(inv.issueDate, inv.updatedAt));
      }, 0);
      avgDaysToPay = Math.round(totalDays / paidInvs.length);
    }

    let score: "low" | "medium" | "high" = "low";
    let label = "Reliable";
    let color = "green";
    let reason = "Consistent on-time payments";

    if (overdueRate > 0.4 || avgDaysToPay > 60) {
      score = "high";
      label = "High Risk";
      color = "red";
      reason = overdueRate > 0.4
        ? `${Math.round(overdueRate * 100)}% of invoices overdue`
        : `Average ${avgDaysToPay} days to pay`;
    } else if (overdueRate > 0.2 || avgDaysToPay > 35) {
      score = "medium";
      label = "Monitor";
      color = "yellow";
      reason = overdueRate > 0.2
        ? `${Math.round(overdueRate * 100)}% of invoices overdue`
        : `Average ${avgDaysToPay} days to pay`;
    }

    results.push({
      clientId: client.id,
      clientName: client.name,
      score,
      label,
      color,
      avgDaysToPay,
      overdueRate,
      totalInvoices: invs.length,
      reason,
    });
  }

  return results.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.score] - order[b.score];
  });
}

// ─── Cash Flow Forecasting ───
export function forecastCashFlow(invoices: Invoice[]): CashFlowForecast[] {
  const paidByMonth = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    const key = getMonthKey(inv.issueDate);
    if (key) {
      paidByMonth.set(key, (paidByMonth.get(key) || 0) + calcTotal(inv));
    }
  }

  const sortedMonths = Array.from(paidByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (sortedMonths.length === 0) return [];

  const amounts = sortedMonths.map(([, v]) => v);
  const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const trend = amounts.length >= 2
    ? (amounts[amounts.length - 1] - amounts[0]) / amounts.length
    : 0;

  const forecasts: CashFlowForecast[] = [];
  const now = new Date();

  for (let i = 1; i <= 6; i++) {
    const future = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = future.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    const predicted = Math.max(0, avg + trend * (sortedMonths.length + i));
    const confidence: "high" | "medium" | "low" =
      sortedMonths.length >= 6 ? "high" : sortedMonths.length >= 3 ? "medium" : "low";

    forecasts.push({
      month: monthKey,
      label: monthLabel,
      predicted: Math.round(predicted * 100) / 100,
      confidence,
      basedOn: sortedMonths.length,
    });
  }

  return forecasts;
}

// ─── Revenue Anomaly Detection ───
export function detectRevenueAnomalies(invoices: Invoice[]): RevenueAnomaly[] {
  const paidByMonth = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    const key = getMonthKey(inv.issueDate);
    if (key) {
      paidByMonth.set(key, (paidByMonth.get(key) || 0) + calcTotal(inv));
    }
  }

  const sorted = Array.from(paidByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  if (sorted.length < 3) return [];

  const amounts = sorted.map(([, v]) => v);
  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance = amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: RevenueAnomaly[] = [];

  for (const [month, amount] of sorted) {
    const deviation = stdDev > 0 ? (amount - mean) / stdDev : 0;
    const absDeviation = Math.abs(deviation);

    if (absDeviation > 1.5) {
      const severity: "info" | "warning" | "critical" =
        absDeviation > 2.5 ? "critical" : absDeviation > 2 ? "warning" : "info";

      const direction = amount > mean ? "higher" : "lower";
      const pct = mean > 0 ? Math.round(Math.abs(amount - mean) / mean * 100) : 0;

      const d = new Date(month + "-01");
      const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      anomalies.push({
        month,
        amount,
        expected: Math.round(mean),
        deviation: Math.round(deviation * 100) / 100,
        severity,
        message: `${monthLabel} revenue was ${pct}% ${direction} than usual (${amount.toFixed(0)} vs avg ${mean.toFixed(0)})`,
      });
    }
  }

  return anomalies;
}

// ─── Smart Payment Reminders ───
export function generatePaymentReminder(
  invoice: Invoice,
  invoices: Invoice[],
  clientName: string
): PaymentReminder[] {
  const overdueDays = invoice.dueDate
    ? Math.max(0, daysBetween(invoice.dueDate, new Date().toISOString().split("T")[0]))
    : 0;

  const total = calcTotal(invoice);
  const sym = invoice.currency === "ZAR" ? "R" : invoice.currency === "EUR" ? "\u20AC" : invoice.currency === "GBP" ? "\u00A3" : "$";

  const clientInvs = invoices.filter((i) => i.clientId === invoice.clientId);
  const clientOverdueCount = clientInvs.filter((i) => i.status === "overdue").length;
  const hasHistory = clientOverdueCount > 1;

  const reminders: PaymentReminder[] = [];

  if (overdueDays === 0) {
    reminders.push({
      type: "gentle",
      subject: `Friendly reminder: Invoice ${invoice.number}`,
      message: `Hi ${clientName},\n\nJust a friendly reminder that invoice ${invoice.number} for ${sym}${total.toFixed(2)} is due today.\n\nPlease let us know if you have any questions.\n\nThank you!`,
      channel: "email",
    });
  } else if (overdueDays <= 7) {
    reminders.push({
      type: "gentle",
      subject: `Invoice ${invoice.number} - Payment reminder`,
      message: `Hi ${clientName},\n\nI hope you're doing well. This is a gentle reminder that invoice ${invoice.number} for ${sym}${total.toFixed(2)} was due ${overdueDays} day${overdueDays > 1 ? "s" : ""} ago.\n\nCould you please let us know when we can expect payment?\n\nThank you!`,
      channel: "email",
    });
  } else if (overdueDays <= 14) {
    reminders.push({
      type: "firm",
      subject: `Overdue: Invoice ${invoice.number} - ${overdueDays} days`,
      message: `Hi ${clientName},\n\nInvoice ${invoice.number} for ${sym}${total.toFixed(2)} is now ${overdueDays} days overdue.\n\nWe kindly request immediate payment. If there are any issues, please contact us so we can arrange a solution.\n\nPayment is expected within 7 days.`,
      channel: "email",
    });
  } else if (overdueDays <= 30) {
    reminders.push({
      type: "urgent",
      subject: `URGENT: Invoice ${invoice.number} - ${overdueDays} days overdue`,
      message: `Hi ${clientName},\n\nDespite our previous reminders, invoice ${invoice.number} for ${sym}${total.toFixed(2)} remains unpaid after ${overdueDays} days.\n\nThis is now critically overdue. Please arrange payment immediately to avoid any disruption to our services.\n\nWe value our relationship and hope to resolve this quickly.`,
      channel: "email",
    });
  } else {
    reminders.push({
      type: "final",
      subject: `FINAL NOTICE: Invoice ${invoice.number} - ${overdueDays} days overdue`,
      message: `Hi ${clientName},\n\nThis is our final notice regarding invoice ${invoice.number} for ${sym}${total.toFixed(2)}, which is now ${overdueDays} days overdue.\n\nIf payment is not received within 7 days, we may need to escalate this matter. We strongly prefer to resolve this amicably.\n\nPlease contact us immediately if you need to discuss payment arrangements.`,
      channel: "email",
    });
  }

  if (overdueDays >= 3) {
    const phone = "";
    reminders.push({
      type: overdueDays > 14 ? "urgent" : "firm",
      subject: `WhatsApp: Invoice ${invoice.number}`,
      message: `Hi ${clientName}, just following up on invoice ${invoice.number} for ${sym}${total.toFixed(2)}. It's ${overdueDays} days overdue. Could you please let us know when we can expect payment? Thank you!`,
      channel: "whatsapp",
    });
  }

  if (hasHistory && overdueDays > 7) {
    reminders.push({
      type: "firm",
      subject: `Account Notice: ${clientName}`,
      message: `Hi ${clientName},\n\nWe've noticed a pattern of late payments on your account (${clientOverdueCount} overdue invoices). To maintain our business relationship, we'd like to discuss adjusting payment terms or setting up a payment plan.\n\nPlease contact us at your earliest convenience.`,
      channel: "email",
    });
  }

  return reminders;
}

// ─── Natural Language Invoice Parser ───
export interface ParsedInvoice {
  clientName: string;
  items: { description: string; quantity: number; rate: number }[];
  notes: string;
  total: number | null;
  confidence: number;
}

export function parseNaturalLanguage(text: string): ParsedInvoice {
  let clientName = "";
  const items: { description: string; quantity: number; rate: number }[] = [];
  let notes = "";
  let total: number | null = null;

  const namePatterns = [
    /(?:for|to|bill|invoice)\s+(?:to\s+)?(.+?)(?:,|\.|\band\b|\d)/i,
    /(?:client|customer|company)[:\s]+(.+?)(?:,|\.|$)/i,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) { clientName = m[1].trim(); break; }
  }

  const itemPatterns = [
    /(\d+)\s+(.+?)\s+(?:at|@|each|per)\s*[R$£€]?\s*([\d,]+(?:\.\d+)?)/gi,
    /(\d+)\s+(?:x\s+)?(.+?)\s+[R$£€]\s*([\d,]+(?:\.\d+)?)/gi,
    /(.+?)\s+(\d+)\s+(?:units?|pcs?|pieces?|hours?|hrs?)\s+(?:at|@)?\s*[R$£€]?\s*([\d,]+(?:\.\d+)?)/gi,
  ];

  for (const pattern of itemPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const qty = parseInt(match[1]) || 1;
      const desc = match[2].trim();
      const rate = parseFloat(match[3].replace(/,/g, "")) || 0;
      if (desc.length > 1 && rate > 0) {
        items.push({ description: desc, quantity: qty, rate });
      }
    }
  }

  if (items.length === 0) {
    const simpleItem = text.match(/(.+?)\s+[R$£€]\s*([\d,]+(?:\.\d+)?)/gi);
    if (simpleItem) {
      for (const s of simpleItem) {
        const parts = s.match(/(.+?)\s+[R$£€]\s*([\d,]+(?:\.\d+)?)/i);
        if (parts && !parts[1].match(/total|tax|vat|discount/i)) {
          items.push({ description: parts[1].trim(), quantity: 1, rate: parseFloat(parts[2].replace(/,/g, "")) });
        }
      }
    }
  }

  const totalMatch = text.match(/(?:total|amount|sum|grand\s*total)[:\s]*[R$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (totalMatch) total = parseFloat(totalMatch[1].replace(/,/g, ""));

  const notesMatch = text.match(/(?:notes?|memo|description)[:\s]+(.+?)(?:\.|$)/i);
  if (notesMatch) notes = notesMatch[1].trim();

  let confidence = 0;
  if (clientName) confidence += 0.3;
  if (items.length > 0) confidence += 0.5;
  if (items.length > 1) confidence += 0.1;
  if (total !== null) confidence += 0.1;

  return { clientName, items, notes, total, confidence: Math.min(1, confidence) };
}
