export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  number: string;
  userId: string;
  clientId: string | null;
  clientName: string;
  issueDate: string;
  dueDate: string;
  status: string;
  taxRate: number;
  discount: number;
  notes: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItem[];
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  createdAt: string;
}

export interface BusinessInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  taxId: string;
  logo: string;
  defaultTaxRate: number;
  defaultCurrency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
}

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];