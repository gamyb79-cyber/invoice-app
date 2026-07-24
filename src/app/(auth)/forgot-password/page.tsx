"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset">("request");

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
      setMessage(data.message || "Check the code below.");
      setStep("reset");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = e.target as HTMLFormElement;
    const resetCode = (form.elements.namedItem("resetCode") as HTMLInputElement).value.trim();
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });
      const data = await res.json();
      if (res.ok) setMessage(data.message);
      else setError(data.error);
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Reset Password</h1>
        {message && <p className="text-green-600 text-sm text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        {step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="text-sm text-gray-600">Enter your email and we will generate a reset code.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Sending..." : "Get Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {code && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Your reset code (copy this):</p>
                <p className="text-2xl font-mono font-bold text-yellow-700 tracking-widest select-all">{code}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paste the code above</label>
              <input type="text" name="resetCode" placeholder="e.g. 573730" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" name="newPassword" required minLength={6} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-600 mt-4">
          <Link href="/login" className="text-indigo-600 hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}