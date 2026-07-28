"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";
import { Invoice } from "@/lib/types";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user as any;
  const hasAccess = ["pro", "trial"].includes(user?.plan);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/invoices").then((r) => r.json()).then((d) => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [status, router]);

  if (status === "loading" || loading) return <div className="text-center py-12 text-gray-500">{t("common", "loading")}</div>;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics & Tax Reports</h1>
        <p className="text-gray-600 mb-6">This feature is available for Pro and Trial users only.</p>
        <Link href="/pricing" className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700">Upgrade to Pro</Link>
      </div>
    );
  }

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => {
      const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
      return sum + sub + sub * (i.taxRate / 100) - i.discount;
    }, 0);

  const totalTax = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => {
      const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
      return sum + sub * (i.taxRate / 100);
    }, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => {
      const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
      return sum + sub + sub * (i.taxRate / 100) - i.discount;
    }, 0);

  const statusCounts = invoices.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  const monthlyData = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => {
      const month = i.issueDate?.slice(0, 7);
      if (month) {
        const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
        acc[month] = (acc[month] || 0) + sub;
      }
      return acc;
    }, {} as Record<string, number>);

  const topClients = invoices
    .filter((i) => i.status === "paid" && i.clientName)
    .reduce((acc, i) => {
      const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
      acc[i.clientName] = (acc[i.clientName] || 0) + sub;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("nav", "analytics")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Revenue (Paid)</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Tax Collected</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalTax)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Invoice Status</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="capitalize text-gray-600">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
          {Object.keys(monthlyData).length === 0 ? (
            <p className="text-gray-500 text-sm">No paid invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(monthlyData).sort().reverse().map(([month, amount]) => (
                <div key={month} className="flex justify-between items-center">
                  <span className="text-gray-600">{month}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Top Clients</h2>
          {Object.keys(topClients).length === 0 ? (
            <p className="text-gray-500 text-sm">No paid invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(topClients).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-gray-600">{name}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">SARS Filing Note</h2>
          <p className="text-sm text-gray-600 mb-2">For South African tax filings:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Keep records of all invoices issued</li>
            <li>Track VAT charged on each invoice</li>
            <li>Export this data for your accountant</li>
            <li>Submit IRP6 by the deadline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
