"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokenType, setTokenType] = useState("monthly");
  const [generatedToken, setGeneratedToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateToken() {
    setLoading(true);
    setError("");
    setGeneratedToken("");
    try {
      const res = await fetch("/api/admin/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tokenType }),
      });
      const data = await res.json();
      if (res.ok) setGeneratedToken(data.token);
      else setError(data.error);
    } catch { setError("Failed to generate token"); }
    setLoading(false);
  }

  function copyToken() {
    navigator.clipboard.writeText(generatedToken);
  }

  if (status === "loading") return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!session) { router.push("/login"); return null; }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin - Token Generator</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <h2 className="font-semibold text-gray-900">Generate Activation Token</h2>
        <p className="text-sm text-gray-600">Create tokens to give users Pro access. Share the token with a user and they enter it on the Pricing page.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Type</label>
          <select value={tokenType} onChange={(e) => setTokenType(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="monthly">Monthly Pro (1 month)</option>
            <option value="lifetime">Lifetime Pro (forever)</option>
          </select>
        </div>

        <button onClick={generateToken} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Generating..." : "Generate Token"}
        </button>

        {generatedToken && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-700 mb-2">Token generated! Copy and share this:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm font-mono text-green-800">{generatedToken}</code>
              <button onClick={copyToken} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">Copy</button>
            </div>
            <p className="text-xs text-green-600 mt-2">This token has not been saved anywhere. Copy it now before you leave.</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mt-4 space-y-3">
        <h2 className="font-semibold text-gray-900">How It Works</h2>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Generate a token above (monthly or lifetime)</li>
          <li>Copy the token and send it to your customer</li>
          <li>Customer goes to Pricing page, enters the token, clicks Activate</li>
          <li>Customer gets Pro access instantly</li>
        </ol>
        <p className="text-xs text-gray-400 mt-2">Note: Tokens are only validated against the list in the checkout API. Generate them and keep a record of which ones you have given out.</p>
      </div>
    </div>
  );
}
