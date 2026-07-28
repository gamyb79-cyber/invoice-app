"use client";

import { useMemo } from "react";
import { Invoice, Client } from "@/lib/types";
import { calculateClientRisk, ClientRisk } from "@/lib/ai";

interface ClientRiskScoreProps {
  invoices: Invoice[];
  clients: Client[];
  clientId?: string;
}

export default function ClientRiskScore({ invoices, clients, clientId }: ClientRiskScoreProps) {
  const risks = useMemo(() => calculateClientRisk(invoices, clients), [invoices, clients]);

  if (clientId) {
    const risk = risks.find((r) => r.clientId === clientId);
    if (!risk) return null;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        risk.color === "red" ? "bg-red-100 text-red-700"
        : risk.color === "yellow" ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700"
      }`}>
        <span className={`w-2 h-2 rounded-full ${
          risk.color === "red" ? "bg-red-500" : risk.color === "yellow" ? "bg-yellow-500" : "bg-green-500"
        }`} />
        {risk.label}
        <span className="text-xs opacity-75">({risk.totalInvoices} inv, ~{risk.avgDaysToPay}d avg)</span>
      </div>
    );
  }

  if (risks.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F3AF;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Client Risk Scores</h3>
          <p className="text-xs text-gray-500">Based on payment history and patterns</p>
        </div>
      </div>

      <div className="space-y-3">
        {risks.map((risk) => (
          <div key={risk.clientId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${
                risk.color === "red" ? "bg-red-500" : risk.color === "yellow" ? "bg-yellow-500" : "bg-green-500"
              }`} />
              <div>
                <p className="font-medium text-gray-900 text-sm">{risk.clientName}</p>
                <p className="text-xs text-gray-500">{risk.reason}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                risk.color === "red" ? "bg-red-100 text-red-700"
                : risk.color === "yellow" ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
              }`}>
                {risk.label}
              </span>
              <p className="text-xs text-gray-400 mt-1">{risk.totalInvoices} invoices</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
