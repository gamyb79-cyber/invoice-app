"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ReferralPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [stats, setStats] = useState({ total: 0, signedUp: 0, activated: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/register?ref=${code}`
    : "";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/referral").then((r) => r.json()).then((data) => {
        if (data.code) setCode(data.code);
        if (data.stats) setStats(data.stats);
        if (data.referrals) setReferrals(data.referrals);
        setLoading(false);
      });
    }
  }, [status, router]);

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareWhatsApp() {
    const msg = encodeURIComponent(
      `I'm using GOGO Invoice for my business - it's free and perfect for South African businesses! Sign up here: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  async function shareTwitter() {
    const msg = encodeURIComponent(
      `Check out GOGO Invoice - free invoicing for SA businesses with ZAR, WhatsApp sharing & AI features! 🚀`
    );
    window.open(`https://twitter.com/intent/tweet?text=${msg}&url=${encodeURIComponent(referralUrl)}`, "_blank");
  }

  async function shareLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      "_blank"
    );
  }

  async function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
      "_blank"
    );
  }

  async function shareEmail() {
    const subject = encodeURIComponent("Check out GOGO Invoice - Free Invoicing App");
    const body = encodeURIComponent(
      `Hey!\n\nI've been using GOGO Invoice for my invoicing and it's amazing - free, easy to use, and built for South African businesses with ZAR currency and WhatsApp sharing.\n\nYou should check it out: ${referralUrl}\n\nCheers!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referredEmail: email }),
    });
    setMessage(`Invite sent to ${email}!`);
    setEmail("");
    setSending(false);
    setTimeout(() => setMessage(""), 3000);
  }

  if (status === "loading" || loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refer &amp; Earn</h1>
        <p className="text-gray-600">Share GOGO Invoice with friends and earn rewards</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Referrals</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.signedUp}</p>
          <p className="text-sm text-gray-500 mt-1">Signed Up</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.activated}</p>
          <p className="text-sm text-gray-500 mt-1">Activated</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Your Referral Link</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" value={referralUrl} readOnly className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700" />
          <button onClick={copyLink} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Your unique code: <span className="font-mono font-bold">{code}</span></p>

        <div className="flex gap-3">
          <button onClick={shareWhatsApp} className="flex-1 bg-[#25D366] text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[#20BD5A] flex items-center justify-center gap-2">
            <span>&#x1F4AC;</span> WhatsApp
          </button>
          <button onClick={shareTwitter} className="flex-1 bg-black text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2">
            <span>&#x1D54F;</span> Twitter
          </button>
          <button onClick={shareLinkedIn} className="flex-1 bg-[#0077B5] text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[#006699] flex items-center justify-center gap-2">
            <span>in</span> LinkedIn
          </button>
          <button onClick={shareFacebook} className="flex-1 bg-[#1877F2] text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[#166FE5] flex items-center justify-center gap-2">
            <span>f</span> Facebook
          </button>
          <button onClick={shareEmail} className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center justify-center gap-2">
            <span>&#x2709;</span> Email
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Send Direct Invite</h2>
        {message && <p className="text-sm text-green-600 mb-3">{message}</p>}
        <form onSubmit={sendInvite} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@email.com"
            required
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={sending} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {sending ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
        <h2 className="font-semibold mb-2">How It Works</h2>
        <ol className="text-sm space-y-2 text-indigo-100">
          <li>1. Share your referral link with friends</li>
          <li>2. They sign up for free using your link</li>
          <li>3. When they create their first invoice, you both get rewards!</li>
        </ol>
      </div>

      {referrals.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Your Referrals</h2>
          <div className="space-y-2">
            {referrals.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">{r.referredEmail || "Link share"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.status === "activated" ? "bg-green-100 text-green-700"
                  : r.status === "signed_up" ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
