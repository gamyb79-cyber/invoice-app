"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, getStatusColor, formatDate } from "@/lib/utils";
import { Invoice } from "@/lib/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currency, setCurrency] = useState("ZAR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/invoices").then((r) => r.json()),
        fetch("/api/business").then((r) => r.json()),
      ]).then(([invData, bizData]) => {
        setInvoices(Array.isArray(invData) ? invData : []);
        if (bizData && !bizData.error) setCurrency(bizData.defaultCurrency || "ZAR");
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  function calcTotal(i: Invoice) {
    const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
    return sub + sub * (i.taxRate / 100) - i.discount;
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + calcTotal(i), 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + calcTotal(i), 0);
  const totalDraft = invoices.filter((i) => i.status === "draft").reduce((s, i) => s + calcTotal(i), 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const pendingCount = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;
  const draftCount = invoices.filter((i) => i.status === "draft").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const recentActivity = [...invoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name || "User"}</p>
        </div>
        <Link href="/invoices/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
          New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
          <p className="text-xs text-green-500 mt-1">{formatCurrency(totalPaid, currency)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
          <p className="text-xs text-yellow-500 mt-1">{formatCurrency(totalOutstanding, currency)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Draft</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{draftCount}</p>
          <p className="text-xs text-gray-400 mt-1">{formatCurrency(totalDraft, currency)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
          <p className="text-sm opacity-80">Total Received</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid, currency)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-lg text-white">
          <p className="text-sm opacity-80">Still Owing You</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalOutstanding, currency)}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-lg text-white">
          <p className="text-sm opacity-80">Total Value (All)</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid + totalOutstanding + totalDraft, currency)}</p>
        </div>
      </div>

      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <span className="text-2xl">&#9888;</span>
          <div>
            <p className="font-medium text-red-800">{overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}</p>
            <p className="text-sm text-red-600">{formatCurrency(
              invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + calcTotal(i), 0), currency
            )} outstanding. Consider following up with clients.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/invoices" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No invoices yet. <Link href="/invoices/new" className="text-indigo-600 hover:underline">Create your first invoice</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentActivity.map((invoice) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{invoice.number}</p>
                    <p className="text-sm text-gray-500 truncate">{invoice.clientName || "No client"} &middot; {formatDate(invoice.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
                  <p className="text-sm font-medium text-gray-900 w-28 text-right">{formatCurrency(calcTotal(invoice), invoice.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
