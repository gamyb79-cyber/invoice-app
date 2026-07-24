"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { Invoice } from "@/lib/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then((res) => res.json())
        .then((data) => {
          setInvoices(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const user = session?.user as any;
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => {
      const sub = i.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
      return sum + sub + sub * (i.taxRate / 100) - i.discount;
    }, 0);
  const pendingCount = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name || "User"}</p>
        </div>
        <Link
          href="/invoices/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-green-600">{paidCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalRevenue, user?.currency || "USD")}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
          <Link href="/invoices" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No invoices yet.{" "}
            <Link href="/invoices/new" className="text-indigo-600 hover:underline">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.slice(0, 5).map((invoice) => {
              const subtotal = invoice.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.number}</p>
                      <p className="text-sm text-gray-500">{invoice.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 w-24 text-right">
                      {formatCurrency(subtotal, invoice.currency)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}