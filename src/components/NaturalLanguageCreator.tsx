"use client";

import { useState, useCallback } from "react";
import { parseNaturalLanguage, ParsedInvoice } from "@/lib/ai";

interface NaturalLanguageCreatorProps {
  onParsed: (result: ParsedInvoice) => void;
}

export default function NaturalLanguageCreator({ onParsed }: NaturalLanguageCreatorProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParsedInvoice | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleParse = useCallback(() => {
    if (!text.trim()) return;
    const parsed = parseNaturalLanguage(text);
    setResult(parsed);
    onParsed(parsed);
  }, [text, onParsed]);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F4AC;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Natural Language Creator</h3>
          <p className="text-xs text-gray-500">Type in plain English and auto-fill the invoice</p>
        </div>
      </div>

      <div className="mb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "Invoice John Smith for 10 consulting hours at R500 each, total R5000"'
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleParse}
          disabled={!text.trim()}
          className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2"
        >
          <span>&#x2728;</span> Parse &amp; Fill
        </button>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
        >
          {showHelp ? "Hide help" : "Show examples"}
        </button>
      </div>

      {showHelp && (
        <div className="bg-gray-50 rounded-lg p-4 mb-3 text-xs text-gray-600 space-y-2">
          <p><strong>Examples:</strong></p>
          <p>&quot;Invoice John for 5 widgets at R100 each&quot;</p>
          <p>&quot;Bill ACME Corp 10 hours consulting at R500/hr&quot;</p>
          <p>&quot;Invoice Sarah 3 logo designs R2000, business cards R800&quot;</p>
          <p>&quot;Create invoice for Mike, web hosting R299 total&quot;</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Parsed Result:</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              result.confidence >= 0.7 ? "bg-green-100 text-green-700"
              : result.confidence >= 0.4 ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
            }`}>
              {Math.round(result.confidence * 100)}% confidence
            </span>
          </div>
          {result.clientName && (
            <p className="text-sm text-gray-600">Client: <span className="font-medium">{result.clientName}</span></p>
          )}
          {result.items.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.items.map((item, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {item.quantity}x {item.description} @ R{item.rate} = R{(item.quantity * item.rate).toFixed(2)}
                </p>
              ))}
            </div>
          )}
          {result.total !== null && (
            <p className="text-sm font-medium text-gray-700 mt-2">Total: R{result.total.toFixed(2)}</p>
          )}
        </div>
      )}
    </div>
  );
}
