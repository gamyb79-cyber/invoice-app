"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Client } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/clients").then((r) => r.json()).then((d) => { setClients(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [status, router]);

  function resetForm() {
    setEditingId(null); setName(""); setEmail(""); setPhone(""); setAddress(""); setCity(""); setState(""); setZip(""); setCountry(""); setShowForm(false);
  }

  function startEdit(c: Client) {
    setEditingId(c.id); setName(c.name); setEmail(c.email); setPhone(c.phone); setAddress(c.address); setCity(c.city); setState(c.state); setZip(c.zip); setCountry(c.country); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { id: editingId, name, email, phone, address, city, state, zip, country };
    const method = editingId ? "PUT" : "POST";
    const res = await fetch("/api/clients", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const data = await res.json();
      if (editingId) setClients((prev) => prev.map((c) => (c.id === editingId ? data : c)));
      else setClients([data, ...clients]);
      resetForm();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  if (status === "loading" || loading) return <div className="text-center py-12 text-gray-500">{t("common", "loading")}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("clients", "title")}</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">{t("clients", "addClient")}</button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editingId ? "Edit Client" : "New Client"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("clients", "name")}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("clients", "email")}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("clients", "phone")}</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Zip</label><input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">{editingId ? t("common", "save") : "Create"}</button>
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">{t("common", "cancel")}</button>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">{t("clients", "noClients")} {t("clients", "addFirst")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.email && <p className="text-sm text-gray-600">{c.email}</p>}
                  {c.phone && <p className="text-sm text-gray-600">{c.phone}</p>}
                  {c.city && <p className="text-sm text-gray-500">{[c.city, c.state, c.country].filter(Boolean).join(", ")}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-sm text-indigo-600 hover:underline">{t("common", "edit")}</button>
                  <button onClick={() => handleDelete(c.id)} className="text-sm text-red-600 hover:underline">{t("common", "delete")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
