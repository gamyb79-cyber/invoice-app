"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CURRENCIES, Invoice, Client } from "@/lib/types";
import { calculateSubtotal, calculateTotal, formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";
import SmartReminder from "@/components/SmartReminder";
import ClientRiskScore from "@/components/ClientRiskScore";

interface LineItemForm { id?: string; description: string; quantity: number; rate: number; }
interface BusinessInfo { name: string; email: string; phone: string; address: string; city: string; state: string; zip: string; country: string; taxId: string; logo: string; }
const DEFAULT_STATUSES = ["draft", "sent", "paid", "overdue"];

function InvoicePDF({ invoice, business }: { invoice: Invoice; business: BusinessInfo | null }) {
  const subtotal = calculateSubtotal(invoice.lineItems);
  const total = calculateTotal(subtotal, invoice.taxRate, invoice.discount);
  const businessAddress = [business?.address, business?.city, business?.state, business?.zip, business?.country].filter(Boolean).join(", ");
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", color: "#333" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div>
          {business?.logo && <img src={business.logo} alt="Logo" style={{ height: "60px", marginBottom: "10px", objectFit: "contain" }} />}
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#4f46e5", margin: 0 }}>INVOICE</h1>
          <p style={{ fontSize: "18px", marginTop: "5px", color: "#555" }}>{invoice.number}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          {business?.name && <p style={{ fontSize: "16px", fontWeight: "bold", margin: "2px 0" }}>{business.name}</p>}
          {business?.email && <p style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>{business.email}</p>}
          {business?.phone && <p style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>{business.phone}</p>}
          {businessAddress && <p style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>{businessAddress}</p>}
          {business?.taxId && <p style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}>Tax ID: {business.taxId}</p>}
          <div style={{ marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
            <p style={{ fontSize: "14px", color: "#666" }}><strong>Status:</strong> {invoice.status.toUpperCase()}</p>
            <p style={{ fontSize: "14px", color: "#666" }}><strong>Issue Date:</strong> {invoice.issueDate}</p>
            <p style={{ fontSize: "14px", color: "#666" }}><strong>Due Date:</strong> {invoice.dueDate}</p>
          </div>
        </div>
      </div>
      <hr style={{ border: "none", borderTop: "2px solid #e5e7eb", marginBottom: "20px" }} />
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "14px", color: "#666", margin: "2px 0" }}><strong>Bill To:</strong></p>
        <p style={{ fontSize: "16px", fontWeight: "bold", margin: "2px 0" }}>{invoice.clientName || "No client"}</p>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead><tr style={{ backgroundColor: "#f3f4f6" }}><th style={{ textAlign: "left", padding: "10px", borderBottom: "2px solid #d1d5db", fontSize: "13px", color: "#374151" }}>Description</th><th style={{ textAlign: "right", padding: "10px", borderBottom: "2px solid #d1d5db", fontSize: "13px", color: "#374151" }}>Qty</th><th style={{ textAlign: "right", padding: "10px", borderBottom: "2px solid #d1d5db", fontSize: "13px", color: "#374151" }}>Rate</th><th style={{ textAlign: "right", padding: "10px", borderBottom: "2px solid #d1d5db", fontSize: "13px", color: "#374151" }}>Amount</th></tr></thead>
        <tbody>{invoice.lineItems.map((item) => (<tr key={item.id}><td style={{ padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{item.description}</td><td style={{ textAlign: "right", padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{item.quantity}</td><td style={{ textAlign: "right", padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{formatCurrency(item.rate, invoice.currency)}</td><td style={{ textAlign: "right", padding: "10px", borderBottom: "1px solid #e5e7eb" }}>{formatCurrency(item.quantity * item.rate, invoice.currency)}</td></tr>))}</tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: "250px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}><span style={{ color: "#6b7280" }}>Subtotal</span><span>{formatCurrency(subtotal, invoice.currency)}</span></div>
          {invoice.taxRate > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}><span style={{ color: "#6b7280" }}>Tax ({invoice.taxRate}%)</span><span>{formatCurrency(subtotal * invoice.taxRate / 100, invoice.currency)}</span></div>}
          {invoice.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px" }}><span style={{ color: "#6b7280" }}>Discount</span><span>-{formatCurrency(invoice.discount, invoice.currency)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "18px", fontWeight: "bold", borderTop: "2px solid #4f46e5", marginTop: "5px" }}><span>Total</span><span style={{ color: "#4f46e5" }}>{formatCurrency(total, invoice.currency)}</span></div>
        </div>
      </div>
      {invoice.notes && <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}><p style={{ fontSize: "13px", fontWeight: "bold", color: "#374151", marginBottom: "5px" }}>Notes:</p><p style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "pre-wrap" }}>{invoice.notes}</p></div>}
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pdfRef = useRef<HTMLDivElement>(null);
  const id = params.id as string;
  const { t } = useTranslation();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [dateError, setDateError] = useState("");
  const [number, setNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status_, setStatus] = useState("draft");
  const [currency, setCurrency] = useState("ZAR");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([
        fetch(`/api/invoices?id=${id}`).then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
        fetch("/api/business").then((r) => r.json()),
        fetch("/api/invoices").then((r) => r.json()),
      ]).then(([invData, clientData, bizData, allInvData]) => {
        if (invData && !invData.error) {
          setInvoice(invData); setNumber(invData.number); setClientId(invData.clientId || "");
          setClientName(invData.clientName || ""); setIssueDate(invData.issueDate); setDueDate(invData.dueDate);
          setStatus(invData.status); setCurrency(invData.currency); setTaxRate(invData.taxRate);
          setDiscount(invData.discount); setNotes(invData.notes);
          setLineItems(invData.lineItems.map((l: any) => ({ id: l.id, description: l.description, quantity: l.quantity, rate: l.rate })));
        }
        if (Array.isArray(clientData)) setClients(clientData);
        if (Array.isArray(allInvData)) setAllInvoices(allInvData);
        if (bizData && !bizData.error) {
          setBusiness(bizData);
          try { const parsed = JSON.parse(bizData.customStatuses || "[]"); if (Array.isArray(parsed) && parsed.length > 0) setStatuses(parsed); } catch {}
        }
        setLoading(false);
      });
    }
  }, [id, status, router]);

  function validateDates(iss: string, due: string) {
    if (iss && due && due < iss) { setDateError("Due date cannot be before issue date"); return false; }
    setDateError(""); return true;
  }

  function handleIssueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; setIssueDate(v); validateDates(v, dueDate);
    if (dueDate && v > dueDate) setDueDate("");
  }

  function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; setDueDate(v); validateDates(issueDate, v);
  }

  function addLineItem() { setLineItems([...lineItems, { description: "", quantity: 1, rate: 0 }]); }
  function removeLineItem(index: number) { if (lineItems.length === 1) return; setLineItems(lineItems.filter((_, i) => i !== index)); }
  function updateLineItem(index: number, field: keyof LineItemForm, value: any) { const updated = [...lineItems]; (updated[index] as any)[field] = value; setLineItems(updated); }
  function handleClientChange(cid: string) { setClientId(cid); const c = clients.find((cl) => cl.id === cid); setClientName(c?.name || ""); }

  const subtotal = calculateSubtotal(lineItems);
  const total = calculateTotal(subtotal, taxRate, discount);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDates(issueDate, dueDate)) return;
    if (!dueDate) { setDateError("Due date is required"); return; }
    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, number, clientId, clientName, issueDate, dueDate, status: status_, currency, taxRate, discount, notes, lineItems }),
    });
    if (res.ok) { const data = await res.json(); setInvoice(data); setEditing(false); } else { alert("Failed to update"); }
    setSaving(false);
  }

  async function handleDelete() { if (!confirm("Delete this invoice?")) return; await fetch(`/api/invoices?id=${id}`, { method: "DELETE" }); router.push("/invoices"); }

  function handleDownloadPdf() {
    setDownloadingPdf(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) { alert("Please allow popups to download PDF"); setDownloadingPdf(false); return; }
    const html = `<!DOCTYPE html><html><head><title>${invoice?.number || "Invoice"}</title></head><body style="margin:0;padding:0;">${pdfRef.current?.innerHTML || ""}</body></html>`;
    printWindow.document.write(html); printWindow.document.close(); printWindow.focus();
    setTimeout(() => { printWindow.print(); setDownloadingPdf(false); }, 500);
  }

  function getStatusColor(s: string) {
    switch (s) { case "paid": return "bg-green-100 text-green-800"; case "sent": return "bg-blue-100 text-blue-800"; case "overdue": return "bg-red-100 text-red-800"; case "draft": return "bg-gray-100 text-gray-800"; default: return "bg-indigo-100 text-indigo-800"; }
  }

  function getWhatsAppLink() {
    const client = clients.find((c) => c.id === invoice?.clientId);
    const phone = client?.phone?.replace(/[^0-9]/g, "") || "";
    const sub = (invoice?.lineItems || []).reduce((s, l) => s + l.quantity * l.rate, 0);
    const total = sub + sub * ((invoice?.taxRate || 0) / 100) - (invoice?.discount || 0);
    const sym = invoice?.currency === "ZAR" ? "R" : invoice?.currency === "EUR" ? "\u20AC" : invoice?.currency === "GBP" ? "\u00A3" : "$";
    const pdfUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/invoices/pdf?id=${id}`;
    const message = encodeURIComponent(
      `Hi ${invoice?.clientName || ""},\n\n` +
      `Please find your invoice ${invoice?.number || ""} for ${sym}${total.toFixed(2)}.\n\n` +
      `Download/View PDF: ${pdfUrl}\n\n` +
      `Thank you for your business!`
    );
    if (phone) return `https://wa.me/${phone.startsWith("27") ? phone : "27" + phone}?text=${message}`;
    return `https://wa.me/?text=${message}`;
  }

  function getEmailLink() {
    const client = clients.find((c) => c.id === invoice?.clientId);
    const email = client?.email || "";
    const sub = (invoice?.lineItems || []).reduce((s, l) => s + l.quantity * l.rate, 0);
    const total = sub + sub * ((invoice?.taxRate || 0) / 100) - (invoice?.discount || 0);
    const sym = invoice?.currency === "ZAR" ? "R" : invoice?.currency === "EUR" ? "\u20AC" : invoice?.currency === "GBP" ? "\u00A3" : "$";
    const pdfUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/invoices/pdf?id=${id}`;
    const subject = encodeURIComponent(`Invoice ${invoice?.number || ""} - ${sym}${total.toFixed(2)}`);
    const body = encodeURIComponent(
      `Hi ${invoice?.clientName || ""},\n\n` +
      `Please find your invoice ${invoice?.number || ""} for ${sym}${total.toFixed(2)}.\n\n` +
      `Download/View PDF: ${pdfUrl}\n\n` +
      `Thank you for your business!`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  if (loading) return <div className="text-center py-12 text-gray-500">{t("common", "loading")}</div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500">Invoice not found</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.number}</h1>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
        </div>
        <div className="flex gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 hover:underline">{t("detail", "edit")}</button>}
          <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="text-sm text-green-600 hover:underline disabled:opacity-50">{downloadingPdf ? "Opening..." : t("detail", "downloadPdf")}</button>
          <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="text-sm text-[#25D366] hover:underline font-medium">{t("detail", "sendWhatsApp")}</a>
          <a href={getEmailLink()} className="text-sm text-blue-600 hover:underline font-medium">{t("detail", "email")}</a>
          <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">{t("detail", "delete")}</button>
          <Link href="/invoices" className="text-sm text-gray-600 hover:text-gray-900">{t("detail", "back")}</Link>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "invoiceNumber")}</label><input type="text" value={number} onChange={(e) => setNumber(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "currency")}</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.symbol} {c.name}</option>))}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "client")}</label><select value={clientId} onChange={(e) => handleClientChange(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">{t("newInvoice", "selectClient")}</option>{clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "issueDate")}</label>
                <input type="date" value={issueDate} onChange={handleIssueDateChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "dueDate")}</label>
                <input type="date" value={dueDate} onChange={handleDueDateChange} min={issueDate || undefined} required className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${dateError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`} />
                {dateError && <p className="text-xs text-red-500 mt-1">{dateError}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "status")}</label><select value={status_} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{statuses.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}</select></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">{t("newInvoice", "lineItems")}</h2>
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-end">
                  <div><input type="text" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder={t("newInvoice", "description")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><input type="number" value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)} min="0" step="any" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><input type="number" value={item.rate} onChange={(e) => updateLineItem(i, "rate", parseFloat(e.target.value) || 0)} min="0" step="any" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div className="px-3 py-2 text-sm bg-gray-50 rounded-md border border-gray-200">{(item.quantity * item.rate).toFixed(2)}</div>
                  <button type="button" onClick={() => removeLineItem(i)} className="text-red-500 hover:text-red-700 pb-2">&times;</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLineItem} className="mt-3 text-sm text-indigo-600 hover:underline">{t("newInvoice", "addItem")}</button>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "subtotal")}</span><span>{subtotal.toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "tax")}</span><input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" className="w-24 border border-gray-300 rounded-md px-3 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="flex items-center justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "discount")}</span><input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} min="0" step="any" className="w-24 border border-gray-300 rounded-md px-3 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="border-t pt-3 flex justify-between font-semibold"><span>{t("newInvoice", "total")}</span><span className="text-indigo-600">{total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "notes")}</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : t("detail", "saveChanges")}</button>
            <button type="button" onClick={() => setEditing(false)} className="px-6 py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">{t("newInvoice", "cancel")}</button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div><p className="text-sm text-gray-500">{t("newInvoice", "client")}</p><p className="font-medium">{invoice.clientName || "No client"}</p></div>
              <div><p className="text-sm text-gray-500">{t("newInvoice", "currency")}</p><p className="font-medium">{invoice.currency}</p></div>
              <div><p className="text-sm text-gray-500">{t("newInvoice", "issueDate")}</p><p className="font-medium">{invoice.issueDate}</p></div>
              <div><p className="text-sm text-gray-500">{t("newInvoice", "dueDate")}</p><p className="font-medium">{invoice.dueDate}</p></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">{t("newInvoice", "lineItems")}</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">{t("newInvoice", "description")}</th><th className="text-right py-2">{t("newInvoice", "qty")}</th><th className="text-right py-2">{t("newInvoice", "rate")}</th><th className="text-right py-2">{t("newInvoice", "amount")}</th></tr></thead>
              <tbody>{invoice.lineItems.map((item) => (<tr key={item.id} className="border-b"><td className="py-2">{item.description}</td><td className="text-right py-2">{item.quantity}</td><td className="text-right py-2">{item.rate.toFixed(2)}</td><td className="text-right py-2">{(item.quantity * item.rate).toFixed(2)}</td></tr>))}</tbody>
            </table>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "subtotal")}</span><span>{subtotal.toFixed(2)}</span></div>
              {invoice.taxRate > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "tax")} ({invoice.taxRate}%)</span><span>{(subtotal * invoice.taxRate / 100).toFixed(2)}</span></div>}
              {invoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "discount")}</span><span>-{invoice.discount.toFixed(2)}</span></div>}
              <div className="border-t pt-2 flex justify-between font-semibold"><span>{t("newInvoice", "total")}</span><span className="text-indigo-600">{formatCurrency(total, invoice.currency)}</span></div>
            </div>
          </div>
          {invoice.notes && <div className="bg-white p-6 rounded-lg border border-gray-200"><h2 className="font-semibold text-gray-900 mb-2">{t("detail", "notes")}</h2><p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p></div>}
        </div>
      )}

      {!editing && invoice.status !== "paid" && (
        <div className="mt-6 space-y-4">
          {invoice.clientId && <ClientRiskScore invoices={allInvoices} clients={clients} clientId={invoice.clientId} />}
          <SmartReminder invoice={invoice} allInvoices={allInvoices} />
        </div>
      )}

      <div ref={pdfRef} style={{ position: "absolute", left: "-9999px", top: 0 }}><InvoicePDF invoice={invoice} business={business} /></div>
    </div>
  );
}
