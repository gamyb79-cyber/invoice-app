"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/types";

const DEFAULT_STATUSES = ["draft", "sent", "paid", "overdue"];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [taxId, setTaxId] = useState("");
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1001);
  const [customStatuses, setCustomStatuses] = useState<string[]>(DEFAULT_STATUSES);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      setEmail(session.user?.email || "");
      setName(session.user?.name || "");
      fetch("/api/business").then((r) => r.json()).then((data) => {
        if (data && !data.error) {
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setState(data.state || "");
          setZip(data.zip || "");
          setCountry(data.country || "");
          setTaxId(data.taxId || "");
          setLogo(data.logo || "");
          setLogoPreview(data.logo || "");
          setDefaultTaxRate(data.defaultTaxRate || 0);
          setDefaultCurrency(data.defaultCurrency || "USD");
          setInvoicePrefix(data.invoicePrefix || "INV");
          setNextInvoiceNumber(data.nextInvoiceNumber || 1001);
          try {
            const parsed = JSON.parse(data.customStatuses || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) setCustomStatuses(parsed);
          } catch {}
        }
        setLoading(false);
      });
    }
  }, [status, session, router]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { const result = ev.target?.result as string; setLogo(result); setLogoPreview(result); };
    reader.readAsDataURL(file);
  }

  function removeLogo() { setLogo(""); setLogoPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }

  function addStatus() {
    const trimmed = newStatus.trim().toLowerCase();
    if (!trimmed) return;
    if (customStatuses.includes(trimmed)) { alert("Status already exists"); return; }
    setCustomStatuses([...customStatuses, trimmed]);
    setNewStatus("");
  }

  function removeStatus(status: string) {
    if (DEFAULT_STATUSES.includes(status)) return;
    setCustomStatuses(customStatuses.filter((s) => s !== status));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address, city, state, zip, country, taxId, logo, customStatuses, defaultTaxRate, defaultCurrency, invoicePrefix, nextInvoiceNumber }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch { alert("Failed to save"); }
    setSaving(false);
  }

  if (status === "loading" || loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const user = session?.user as any;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Account</h2>
        <p className="text-sm text-gray-600 mb-4">{session?.user?.email}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
          {user?.plan === "pro" ? "Pro Plan" : user?.plan === "trial" ? "Trial" : user?.plan === "friend" ? "Friend Plan" : "Free Plan"}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h2 className="font-semibold text-gray-900">Company Logo</h2>
          <div className="flex items-start gap-4">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo" className="w-24 h-24 object-contain border border-gray-200 rounded-lg p-2" />
                <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">&times;</button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs text-center">No logo</div>
            )}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </button>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB. Shows on invoices.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 mt-4">
          <h2 className="font-semibold text-gray-900">Business Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label><input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Zip</label><input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 mt-4">
          <h2 className="font-semibold text-gray-900">Invoice Defaults</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.symbol} {c.code}</option>))}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label><input type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)} min="0" max="100" step="0.1" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label><input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Next Invoice Number</label><input type="number" value={nextInvoiceNumber} onChange={(e) => setNextInvoiceNumber(parseInt(e.target.value) || 1001)} min="1" className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 mt-4">
          <h2 className="font-semibold text-gray-900">Custom Invoice Statuses</h2>
          <p className="text-sm text-gray-500">Add your own statuses like &quot;PO&quot;, &quot;Pending&quot;, &quot;Cancelled&quot;, etc.</p>
          <div className="flex gap-2">
            <input type="text" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStatus(); } }} placeholder="New status (e.g. PO)" className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="button" onClick={addStatus} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customStatuses.map((s) => (
              <span key={s} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${DEFAULT_STATUSES.includes(s) ? "bg-gray-100 text-gray-700" : "bg-indigo-100 text-indigo-700"}`}>
                {s}
                {!DEFAULT_STATUSES.includes(s) && (
                  <button type="button" onClick={() => removeStatus(s)} className="ml-1 text-indigo-500 hover:text-indigo-700">&times;</button>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Save Settings"}</button>
          {saved && <span className="text-sm text-green-600">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
}