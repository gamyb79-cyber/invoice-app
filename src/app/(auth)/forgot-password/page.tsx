"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "reset" | "success">("request");

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
      if (data.code) {
        setCode(data.code);
        setMessage(t("forgotPassword", "accountFound"));
        setStep("reset");
      } else {
        setError(t("forgotPassword", "noAccount"));
      }
    } catch {
      setError(t("common", "error"));
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
      if (res.ok) {
        setMessage(data.message);
        setStep("success");
      } else {
        setError(data.error);
      }
    } catch {
      setError(t("common", "error"));
    }
    setLoading(false);
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">{t("forgotPassword", "title")}</h1>
        {message && <p className="text-green-600 text-sm text-center mb-4">{message}</p>}
        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        {step === "request" && (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="text-sm text-gray-600">{t("forgotPassword", "enterEmail")}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("auth", "email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Sending..." : t("forgotPassword", "getResetCode")}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            {code && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-md p-4 text-center">
                <p className="text-sm font-semibold text-yellow-800 mb-2">{t("forgotPassword", "yourCode")}</p>
                <p className="text-3xl font-mono font-bold text-yellow-700 tracking-[0.3em] select-all">{code}</p>
                <p className="text-xs text-gray-500 mt-2">{t("forgotPassword", "copyBelow")}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("forgotPassword", "pasteCode")}</label>
              <input type="text" name="resetCode" placeholder="e.g. 573730" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("forgotPassword", "newPassword")}</label>
              <input type="password" name="newPassword" required minLength={6} placeholder="At least 6 characters" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Resetting..." : t("forgotPassword", "resetPassword")}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">Your password has been reset successfully.</p>
            <Link href="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700">
              {t("auth", "signInBtn")}
            </Link>
          </div>
        )}

        <p className="text-sm text-center text-gray-600 mt-4">
          <Link href="/login" className="text-indigo-600 hover:underline">{t("forgotPassword", "backToSignIn")}</Link>
        </p>
      </div>
    </div>
  );
}
