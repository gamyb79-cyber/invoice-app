"use client";

import { useMemo } from "react";
import { Invoice } from "@/lib/types";
import { forecastCashFlow, CashFlowForecast } from "@/lib/ai";

interface CashFlowWidgetProps {
  invoices: Invoice[];
}

export default function CashFlowWidget({ invoices }: CashFlowWidgetProps) {
  const forecasts = useMemo(() => forecastCashFlow(invoices), [invoices]);

  if (forecasts.length === 0) return null;

  const maxAmount = Math.max(...forecasts.map((f) => f.predicted));

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F4C8;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Cash Flow Forecast</h3>
          <p className="text-xs text-gray-500">Next 6 months predicted income</p>
        </div>
      </div>

      <div className="space-y-3">
        {forecasts.map((f) => {
          const width = maxAmount > 0 ? (f.predicted / maxAmount) * 100 : 0;
          return (
            <div key={f.month}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{f.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">R{f.predicted.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    f.confidence === "high" ? "bg-green-100 text-green-600"
                    : f.confidence === "medium" ? "bg-yellow-100 text-yellow-600"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {f.confidence}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    f.confidence === "high" ? "bg-emerald-500"
                    : f.confidence === "medium" ? "bg-yellow-500"
                    : "bg-gray-400"
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Based on {forecasts[0]?.basedOn || 0} months of payment data. Confidence improves with more history.
      </p>
    </div>
  );
}
