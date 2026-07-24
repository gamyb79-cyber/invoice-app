"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message + " Reloading...");
        setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
      } else { setError(data.error); }
    } catch { setError("Something went wrong"); }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h1>
        <p className="text-gray-600">Start free, upgrade when you need more.</p>
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 text-center">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-center">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Free</h2>
          <p className="text-3xl font-bold text-gray-900 mb-4">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
          <ul className="space-y-3 mb-8 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Up to 3 invoices</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Client management</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> All currencies</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Browser storage</li>
          </ul>
          {!session && <Link href="/register" className="block text-center w-full py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Get Started</Link>}
        </div>

        <div className="bg-white p-8 rounded-lg border-2 border-indigo-600 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">Popular</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pro</h2>
          <p className="text-3xl font-bold text-gray-900 mb-4">$9.99<span className="text-sm font-normal text-gray-500">/mo</span></p>
          <ul className="space-y-3 mb-8 text-sm text-gray-600">
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Unlimited invoices</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Cloud storage</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Analytics &amp; tax reports</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Priority support</li>
          </ul>
          {session ? (
            <form onSubmit={handleActivate} className="space-y-3">
              <p className="text-xs text-gray-500 text-center">Have a token? Enter it below</p>
              <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter activation token" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={loading || !token} className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">{loading ? "Activating..." : "Activate Pro"}</button>
            </form>
          ) : (
            <Link href="/register" className="block text-center w-full py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Get Started</Link>
          )}
        </div>
      </div>
    </div>
  );
}