"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, getStatusColor, formatDate } from "@/lib/utils";
import { Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/invoices")
        .then((res) => res.json())
        .then((data) => { setInvoices(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleDuplicate(inv: Invoice) {
    setDuplicating(inv.id);
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: inv.clientId, clientName: inv.clientName,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: "", status: "draft", currency: inv.currency,
        taxRate: inv.taxRate, discount: 0, notes: inv.notes,
        lineItems: inv.lineItems.map((l) => ({ description: l.description, quantity: l.quantity, rate: l.rate })),
      }),
    });
    if (res.ok) {
      const newInv = await res.json();
      setInvoices([newInv, ...invoices]);
    }
    setDuplicating(null);
  }

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch = inv.number.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalAmount = filtered.reduce((sum, inv) => {
    const sub = inv.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
    return sum + sub + sub * (inv.taxRate / 100) - inv.discount;
  }, 0);

  if (status === "loading" || loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""} &middot; {formatCurrency(totalAmount, "ZAR")}</p>
        </div>
        <Link href="/invoices/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">New Invoice</Link>
      </div>

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search by number or client..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          No invoices found. <Link href="/invoices/new" className="text-indigo-600 hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const subtotal = inv.lineItems.reduce((s, l) => s + l.quantity * l.rate, 0);
            const total = subtotal + subtotal * (inv.taxRate / 100) - inv.discount;
            return (
              <div key={inv.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/invoices/${inv.id}`} className="font-semibold text-indigo-600 hover:underline">{inv.number}</Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{inv.clientName || "No client"} &middot; {formatDate(inv.issueDate)}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(total, inv.currency)}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDuplicate(inv)} disabled={duplicating === inv.id} className="text-xs text-gray-500 hover:text-indigo-600 disabled:opacity-50" title="Duplicate">{duplicating === inv.id ? "..." : "Duplicate"}</button>
                      <button onClick={() => handleDelete(inv.id)} className="text-xs text-gray-500 hover:text-red-600" title="Delete">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
