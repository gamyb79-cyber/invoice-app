"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CURRENCIES, Client } from "@/lib/types";
import { calculateSubtotal, calculateTotal, formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";
import InvoiceScanner from "@/components/InvoiceScanner";
import VoiceDictation from "@/components/VoiceDictation";
import NaturalLanguageCreator from "@/components/NaturalLanguageCreator";

interface LineItemForm { description: string; quantity: number; rate: number; }
const DEFAULT_STATUSES = ["draft", "sent", "paid", "overdue"];

export default function NewInvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [statuses, setStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [status_, setStatus] = useState("draft");
  const [currency, setCurrency] = useState("ZAR");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([{ description: "", quantity: 1, rate: 0 }]);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/business").then((r) => r.json()),
    ]).then(([clientData, bizData]) => {
      if (Array.isArray(clientData)) setClients(clientData);
      if (bizData && !bizData.error) {
        if (bizData.defaultCurrency) setCurrency(bizData.defaultCurrency);
        if (bizData.defaultTaxRate) setTaxRate(bizData.defaultTaxRate);
        try { const parsed = JSON.parse(bizData.customStatuses || "[]"); if (Array.isArray(parsed) && parsed.length > 0) setStatuses(parsed); } catch {}
      }
    });
  }, [status, router]);

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
  function updateLineItem(index: number, field: keyof LineItemForm, value: string | number) { const updated = [...lineItems]; (updated[index] as any)[field] = value; setLineItems(updated); }
  function handleClientChange(id: string) { setClientId(id); const client = clients.find((c) => c.id === id); setClientName(client?.name || ""); }

  const handleScanResult = useCallback((result: { clientName: string; items: { description: string; quantity: number; rate: number }[]; total: number }) => {
    if (result.clientName) setClientName(result.clientName);
    if (result.items.length > 0) {
      setLineItems(result.items);
    }
    if (result.total > 0 && result.items.length === 0) {
      setLineItems([{ description: "Scanned invoice total", quantity: 1, rate: result.total }]);
    }
  }, []);

  const handleNLParsed = useCallback((result: { clientName: string; items: { description: string; quantity: number; rate: number }[]; total: number | null }) => {
    if (result.clientName) setClientName(result.clientName);
    if (result.items.length > 0) setLineItems(result.items);
    if (result.total !== null && result.items.length === 0) {
      setLineItems([{ description: "Invoice total", quantity: 1, rate: result.total }]);
    }
  }, []);

  const handleVoiceResult = useCallback((text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();

    const WORD_NUMS: Record<string, number> = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, twenty:20, thirty:30, forty:40, fifty:50, hundred:100, thousand:1000 };
    function parseWordNum(s: string): number { return WORD_NUMS[s.toLowerCase()] || 0; }
    function parseQuantity(s: string): number {
      const n = parseInt(s);
      if (!isNaN(n)) return n;
      const w = s.toLowerCase().trim();
      if (WORD_NUMS[w]) return WORD_NUMS[w];
      const parts = w.split(/\s*-\s*/);
      if (parts.length === 2) return (parseWordNum(parts[0]) || 0) + (parseWordNum(parts[1]) || 0);
      return 0;
    }
    function parseAmount(s: string): number {
      const cleaned = s.replace(/[R$£€,\s]/g, "").replace(/rand|dollar|usd/gi, "");
      return parseFloat(cleaned) || 0;
    }

    const nameMatch = text.match(/(?:for|to|bill)\s+(.+?)(?:,|\.|:|\band\b)/i);
    if (nameMatch) {
      const extracted = nameMatch[1].trim().split(/\s+(?:who|and|orders|buys|bought|wants|needs)/i)[0].trim();
      if (extracted.length > 1 && !WORD_NUMS[extracted.toLowerCase()]) setClientName(extracted);
    }

    const lines = text.split(/[.;,]|\band\b/i).map((s) => s.trim()).filter(Boolean);
    const items: LineItemForm[] = [];
    let totalFromVoice = 0;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      const totalMatch = line.match(/(?:total|amount|sum|comes?\s+to|equals?)[\s:]*(?:R|ZAR|\$|£|€)?\s*([\d,]+(?:\.\d+)?)\s*(?:rand|dollars|usd|gbp|eur)?/i);
      if (totalMatch) {
        totalFromVoice = parseAmount(totalMatch[1]);
        continue;
      }

      if (lowerLine.match(/^(total|subtotal|tax|vat|discount|date|invoice|receipt|bill)$/i)) continue;

      const qtyItemPrice = line.match(
        /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty)\s+(.+?)\s+(?:at|@|each|per|for)\s+(?:R|ZAR|\$|£|€)?\s*([\d,]+(?:\.\d+)?)\s*(?:rand|dollars|each|per\s+unit)?/i
      );
      if (qtyItemPrice) {
        items.push({
          description: qtyItemPrice[2].trim().replace(/\s+at\s+.*$/i, ""),
          quantity: parseQuantity(qtyItemPrice[1]) || 1,
          rate: parseAmount(qtyItemPrice[3]),
        });
        continue;
      }

      const itemQtyPrice = line.match(
        /(.+?)\s*[-:x]\s*(\d+)\s+(?:units?|pieces?|pcs|items?)?\s*(?:at|@|each|per)?\s*(?:R|ZAR|\$|£|€)?\s*([\d,]+(?:\.\d+)?)\s*(?:rand|dollars)?/i
      );
      if (itemQtyPrice) {
        items.push({
          description: itemQtyPrice[1].trim(),
          quantity: parseInt(itemQtyPrice[2]) || 1,
          rate: parseAmount(itemQtyPrice[3]),
        });
        continue;
      }

      const priceMatch = line.match(
        /(.+?)\s+(?:R|ZAR|\$|£|€)\s*([\d,]+(?:\.\d+)?)\s*(?:rand|dollars)?/i
      );
      if (priceMatch && !lowerLine.match(/total|tax|vat|discount|subtotal/)) {
        items.push({
          description: priceMatch[1].trim(),
          quantity: 1,
          rate: parseAmount(priceMatch[2]),
        });
        continue;
      }

      const itemThenPrice = line.match(
        /(.+?)\s+([\d,]+(?:\.\d+)?)\s*(?:rand|rands|dollars|usd)/i
      );
      if (itemThenPrice && !lowerLine.match(/total|tax|vat|discount|subtotal|invoice/)) {
        const desc = itemThenPrice[1].trim();
        if (desc.length > 1) {
          items.push({ description: desc, quantity: 1, rate: parseAmount(itemThenPrice[2]) });
          continue;
        }
      }

      const descOnly = line.trim();
      if (descOnly.length > 2 && !lowerLine.match(/total|tax|vat|discount|subtotal|invoice|date|receipt|amount|sum|rand|dollar/i)) {
        items.push({ description: descOnly, quantity: 1, rate: 0 });
      }
    }

    if (items.length === 0 && totalFromVoice > 0) {
      items.push({ description: "Invoice total", quantity: 1, rate: totalFromVoice });
    }

    if (items.length > 0) {
      const filledItems = items.map((item) => ({
        ...item,
        description: item.description || "Item",
        quantity: item.quantity || 1,
        rate: item.rate || 0,
      }));
      setLineItems(filledItems);
    } else {
      setNotes((prev) => prev ? prev + "\n" + text : text);
    }
  }, []);

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setSavingClient(true);
    const res = await fetch("/api/clients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newClientName, email: newClientEmail, phone: newClientPhone }),
    });
    if (res.ok) {
      const newClient = await res.json();
      setClients([...clients, newClient]);
      setClientId(newClient.id);
      setClientName(newClient.name);
      setShowNewClient(false);
      setNewClientName(""); setNewClientEmail(""); setNewClientPhone("");
    }
    setSavingClient(false);
  }

  const subtotal = calculateSubtotal(lineItems);
  const total = calculateTotal(subtotal, taxRate, discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDates(issueDate, dueDate)) return;
    if (!dueDate) { setDateError("Due date is required"); return; }
    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientName, issueDate, dueDate, status: status_, currency, taxRate, discount, notes, lineItems }),
    });
    if (res.ok) router.push("/invoices");
    else { const data = await res.json(); alert(data.error || "Failed to create invoice"); setSaving(false); }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("newInvoice", "title")}</h1>
        <Link href="/invoices" className="text-sm text-gray-600 hover:text-gray-900">Back to invoices</Link>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3"
        >
          <span className="text-xl">&#x1F916;</span>
          <span>AI Assistant - Scan Paper Invoice or Dictate Details</span>
          <svg className={`w-4 h-4 transition-transform ${showAIPanel ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showAIPanel && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InvoiceScanner onScanResult={handleScanResult} />
          <VoiceDictation onResult={handleVoiceResult} />
          <div className="md:col-span-2">
            <NaturalLanguageCreator onParsed={handleNLParsed} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "invoiceNumber")}</label>
              <input type="text" value={t("newInvoice", "autoGenerated")} disabled className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-400" />
              <p className="text-xs text-gray-400 mt-1">{t("newInvoice", "autoNumberDesc")}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "currency")}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.symbol} {c.name}</option>))}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">{t("newInvoice", "client")}</label>
              <button type="button" onClick={() => setShowNewClient(true)} className="text-xs text-indigo-600 hover:underline">{t("newInvoice", "addNewClient")}</button>
            </div>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Type client name or select below"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
            />
            <select value={clientId} onChange={(e) => { handleClientChange(e.target.value); }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t("newInvoice", "selectClient")}</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "issueDate")}</label>
              <input type="date" value={issueDate} onChange={handleIssueDateChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "dueDate")}</label>
              <input type="date" value={dueDate} onChange={handleDueDateChange} min={issueDate || undefined} required className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${dateError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`} />
              {dateError && <p className="text-xs text-red-500 mt-1">{dateError}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "status")}</label>
            <select value={status_} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {statuses.map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
            </select>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">{t("newInvoice", "lineItems")}</h2>
          <div className="space-y-3">
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-end">
                <div><label className="block text-xs text-gray-500 mb-1">{t("newInvoice", "description")}</label><input type="text" value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder="Item description" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">{t("newInvoice", "qty")}</label><input type="number" value={item.quantity} onChange={(e) => updateLineItem(i, "quantity", parseFloat(e.target.value) || 0)} min="0" step="any" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">{t("newInvoice", "rate")}</label><input type="number" value={item.rate} onChange={(e) => updateLineItem(i, "rate", parseFloat(e.target.value) || 0)} min="0" step="any" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">{t("newInvoice", "amount")}</label><div className="px-3 py-2 text-sm bg-gray-50 rounded-md border border-gray-200">{formatCurrency(item.quantity * item.rate, currency)}</div></div>
                <button type="button" onClick={() => removeLineItem(i)} className="text-red-500 hover:text-red-700 pb-2">&times;</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLineItem} className="mt-3 text-sm text-indigo-600 hover:underline">{t("newInvoice", "addItem")}</button>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "subtotal")}</span><span>{formatCurrency(subtotal, currency)}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "tax")}</span><input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" className="w-24 border border-gray-300 rounded-md px-3 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="flex items-center justify-between text-sm"><span className="text-gray-600">{t("newInvoice", "discount")}</span><input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} min="0" step="any" className="w-24 border border-gray-300 rounded-md px-3 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="border-t pt-3 flex justify-between font-semibold"><span>{t("newInvoice", "total")}</span><span className="text-indigo-600">{formatCurrency(total, currency)}</span></div>
          </div>
          <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">{t("newInvoice", "notes")}</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("newInvoice", "notesPlaceholder")} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">{saving ? "Creating..." : t("newInvoice", "createInvoice")}</button>
          <Link href="/invoices" className="px-6 py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">{t("newInvoice", "cancel")}</Link>
        </div>
      </form>

      {showNewClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewClient(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("addClient", "title")}</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("addClient", "name")} *</label>
                <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("addClient", "email")}</label>
                <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("addClient", "phone")}</label>
                <input type="tel" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingClient} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">{savingClient ? "Adding..." : t("addClient", "addClient")}</button>
                <button type="button" onClick={() => setShowNewClient(false)} className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">{t("addClient", "cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
