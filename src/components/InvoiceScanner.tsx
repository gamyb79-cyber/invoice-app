"use client";

import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";

interface ScanResult {
  clientName: string;
  items: { description: string; quantity: number; rate: number }[];
  total: number;
  rawText: string;
}

interface InvoiceScannerProps {
  onScanResult: (result: ScanResult) => void;
}

export default function InvoiceScanner({ onScanResult }: InvoiceScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const parseInvoiceText = useCallback((text: string): ScanResult => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    let clientName = "";
    let total = 0;
    const items: { description: string; quantity: number; rate: number }[] = [];

    const totalPatterns = [
      /(?:total|amount\s*due|balance\s*due|grand\s*total)[:\s]*[R$£€]?\s*([\d,]+\.?\d*)/i,
      /[R$£€]\s*([\d,]+\.?\d*)\s*(?:total|due)/i,
    ];
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        total = parseFloat(match[1].replace(/,/g, ""));
        break;
      }
    }

    const billToMatch = text.match(/(?:bill\s*to|client|customer|sold\s*to)[:\s]*(.+)/i);
    if (billToMatch) clientName = billToMatch[1].trim();

    if (!clientName) {
      for (const line of lines.slice(0, 10)) {
        if (line.length > 3 && line.length < 50 && !line.match(/^\d/) && !line.match(/invoice|date|number|total|tax|vat/i)) {
          clientName = line;
          break;
        }
      }
    }

    const itemPattern = /^(\d+)\s+(.{3,60}?)\s+[R$£€]?\s*([\d,]+\.?\d*)\s+[R$£€]?\s*([\d,]+\.?\d*)$/;
    const simpleItemPattern = /^(.{3,60}?)\s+[R$£€]?\s*([\d,]+\.?\d*)$/;

    for (const line of lines) {
      const itemMatch = line.match(itemPattern);
      if (itemMatch) {
        items.push({
          description: itemMatch[2].trim(),
          quantity: parseInt(itemMatch[1]) || 1,
          rate: parseFloat(itemMatch[3].replace(/,/g, "")) || 0,
        });
        continue;
      }
      const simpleMatch = line.match(simpleItemPattern);
      if (simpleMatch && !simpleMatch[1].match(/total|tax|vat|subtotal|discount|amount|date|invoice/i)) {
        items.push({
          description: simpleMatch[1].trim(),
          quantity: 1,
          rate: parseFloat(simpleMatch[2].replace(/,/g, "")) || 0,
        });
      }
    }

    if (items.length === 0 && total > 0) {
      items.push({ description: "Scanned item", quantity: 1, rate: total });
    }

    return { clientName, items, total, rawText: text };
  }, []);

  const processImage = useCallback(async (file: File) => {
    setScanning(true);
    setProgress(0);
    setError("");
    setRawText(null);

    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();

      setRawText(data.text);
      const result = parseInvoiceText(data.text);
      onScanResult(result);
    } catch (err) {
      setError("Failed to scan image. Please try again.");
    }
    setScanning(false);
  }, [parseInvoiceText, onScanResult]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    processImage(file);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F4F7;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Invoice Scanner</h3>
          <p className="text-xs text-gray-500">Scan a paper invoice with your camera or upload a photo</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={scanning}
          className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>&#x1F4F9;</span> Take Photo
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>&#x1F4C1;</span> Upload Image
        </button>
      </div>

      {scanning && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Scanning invoice...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {preview && !scanning && (
        <div className="mb-4">
          <img src={preview} alt="Scanned invoice" className="w-full max-h-48 object-contain rounded border border-gray-200" />
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {rawText && !scanning && (
        <div className="mt-3">
          <button onClick={() => setShowRaw(!showRaw)} className="text-xs text-indigo-600 hover:underline">
            {showRaw ? "Hide" : "Show"} extracted text
          </button>
          {showRaw && (
            <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-auto whitespace-pre-wrap">{rawText}</pre>
          )}
        </div>
      )}
    </div>
  );
}
