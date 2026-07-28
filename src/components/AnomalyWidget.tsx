"use client";

import { useMemo } from "react";
import { Invoice } from "@/lib/types";
import { detectRevenueAnomalies, RevenueAnomaly } from "@/lib/ai";

interface AnomalyWidgetProps {
  invoices: Invoice[];
}

export default function AnomalyWidget({ invoices }: AnomalyWidgetProps) {
  const anomalies = useMemo(() => detectRevenueAnomalies(invoices), [invoices]);

  if (anomalies.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg">&#x1F50D;</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Revenue Patterns</h3>
            <p className="text-xs text-gray-500">Monitoring for unusual activity</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-green-700">&#x2705; All looks normal! No revenue anomalies detected.</p>
          <p className="text-xs text-green-600 mt-1">Keep invoicing consistently for better insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x26A0;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Revenue Anomalies</h3>
          <p className="text-xs text-gray-500">{anomalies.length} unusual pattern{anomalies.length > 1 ? "s" : ""} detected</p>
        </div>
      </div>

      <div className="space-y-3">
        {anomalies.map((a) => (
          <div key={a.month} className={`p-4 rounded-lg border ${
            a.severity === "critical" ? "bg-red-50 border-red-200"
            : a.severity === "warning" ? "bg-orange-50 border-orange-200"
            : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  a.severity === "critical" ? "text-red-800"
                  : a.severity === "warning" ? "text-orange-800"
                  : "text-blue-800"
                }`}>
                  {a.severity === "critical" ? "&#x1F6A8;" : a.severity === "warning" ? "&#x26A0;&#xFE0F;" : "&#x2139;&#xFE0F;"} {a.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Actual: R{a.amount.toLocaleString()} | Expected: ~R{a.expected.toLocaleString()} | Deviation: {a.deviation > 0 ? "+" : ""}{a.deviation}σ
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
