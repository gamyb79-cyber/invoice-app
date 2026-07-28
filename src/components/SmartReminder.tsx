"use client";

import { useState, useEffect } from "react";
import { Invoice } from "@/lib/types";
import { generatePaymentReminder, PaymentReminder } from "@/lib/ai";

interface SmartReminderProps {
  invoice: Invoice;
  allInvoices: Invoice[];
}

export default function SmartReminder({ invoice, allInvoices }: SmartReminderProps) {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [selected, setSelected] = useState<PaymentReminder | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const clientName = invoice.clientName || "Valued Client";
    const generated = generatePaymentReminder(invoice, allInvoices, clientName);
    setReminders(generated);
    if (generated.length > 0) setSelected(generated[0]);
  }, [invoice, allInvoices]);

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getWhatsAppLink(reminder: PaymentReminder) {
    const phone = "";
    const message = encodeURIComponent(reminder.message);
    return `https://wa.me/?text=${message}`;
  }

  function getEmailLink(reminder: PaymentReminder) {
    const subject = encodeURIComponent(reminder.subject);
    const body = encodeURIComponent(reminder.message);
    return `mailto:?subject=${subject}&body=${body}`;
  }

  const overdueDays = invoice.dueDate
    ? Math.max(0, Math.round((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (reminders.length === 0 || invoice.status === "paid") return null;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F514;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Smart Payment Reminder</h3>
          <p className="text-xs text-gray-500">
            {overdueDays > 0 ? `${overdueDays} days overdue` : "Due today"}
            {reminders.length > 1 ? ` - ${reminders.length} options available` : ""}
          </p>
        </div>
      </div>

      {reminders.length > 1 && (
        <div className="flex gap-2 mb-4">
          {reminders.map((r, i) => (
            <button
              key={i}
              onClick={() => setSelected(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selected === r
                  ? r.type === "gentle" ? "bg-green-100 text-green-700"
                    : r.type === "firm" ? "bg-yellow-100 text-yellow-700"
                    : r.type === "urgent" ? "bg-orange-100 text-orange-700"
                    : "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r.type.charAt(0).toUpperCase() + r.type.slice(1)} {r.channel === "whatsapp" ? "WA" : "Email"}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
            <p className="text-xs text-gray-400 mb-1">Subject: {selected.subject}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.message}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(selected.message)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              {copied ? "Copied!" : "Copy Text"}
            </button>
            {selected.channel === "whatsapp" ? (
              <a
                href={getWhatsAppLink(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#20BD5A] flex items-center gap-2"
              >
                Send WhatsApp
              </a>
            ) : (
              <a
                href={getEmailLink(selected)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                Send Email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
