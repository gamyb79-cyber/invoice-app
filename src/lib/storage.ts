import { Invoice, Client, BusinessInfo } from "./types";

const INVOICES_KEY = "invoicepro_invoices";
const CLIENTS_KEY = "invoicepro_clients";
const BUSINESS_KEY = "invoicepro_business";

export const localStorage = {
  getInvoices(): Invoice[] {
    if (typeof window === "undefined") return [];
    try {
      const data = window.localStorage.getItem(INVOICES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveInvoices(invoices: Invoice[]): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  },

  getClients(): Client[] {
    if (typeof window === "undefined") return [];
    try {
      const data = window.localStorage.getItem(CLIENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveClients(clients: Client[]): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  getBusinessInfo(): BusinessInfo | null {
    if (typeof window === "undefined") return null;
    try {
      const data = window.localStorage.getItem(BUSINESS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveBusinessInfo(info: BusinessInfo): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BUSINESS_KEY, JSON.stringify(info));
  },
};