import { CURRENCIES } from "./types";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
  });
  return `${currency.symbol}${formatted}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function calculateLineTotal(quantity: number, rate: number): number {
  return quantity * rate;
}

export function calculateSubtotal(lineItems: { quantity: number; rate: number }[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calculateTotal(subtotal: number, taxRate: number, discount: number): number {
  const tax = calculateTax(subtotal, taxRate);
  return subtotal + tax - discount;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800";
  }
}