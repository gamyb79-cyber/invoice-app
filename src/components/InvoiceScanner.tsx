"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

async function pdfToImage(file: File): Promise<Blob> {
  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  await loadScript(PDFJS_URL);
  const pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await pdf.getPage(1);
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

export default function InvoiceScanner({ onScanResult }: InvoiceScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tips, setTips] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const parseInvoiceText = useCallback((text: string): ScanResult => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    let clientName = "";
    let total = 0;
    const items: { description: string; quantity: number; rate: number }[] = [];

    const totalPatterns = [
      /(?:total|amount\s*due|balance\s*due|grand\s*total|net\s*total)[:\s]*(?:R|ZAR|\$|£|€)?\s*([\d,]+\.?\d*)\s*(?:rand|usd|gbp|eur)?/i,
      /(?:R|ZAR|\$|£|€)\s*([\d,]+\.?\d*)\s*(?:total|due)/i,
      /(?:TOTAL|TOT|AMT)[\s|.]*([\d,]+\.?\d*)/i,
      /\[(\d{3,})/,
      /(?:subtotal|sub\s*total)[:\s]*(?:R|ZAR|\$|£|€)?\s*([\d,]+\.?\d*)/i,
    ];
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (val > 0 && (val > total || total === 0)) total = val;
      }
    }

    const billToPatterns = [
      /(?:bill\s*to|client|customer|sold\s*to|account\s*(?:name|holder)|name)[:\s]*(.+)/i,
      /(?:ACC(?:OUNT)?\s*(?:NAME|NAM|NAN))[:\s]*(.+)/i,
    ];
    for (const pattern of billToPatterns) {
      const match = text.match(pattern);
      if (match) {
        const extracted = match[1].trim().split(/\s{2,}/)[0].trim();
        if (extracted.length > 1 && extracted.length < 60) {
          clientName = extracted;
          break;
        }
      }
    }

    if (!clientName) {
      for (const line of lines.slice(0, 15)) {
        if (
          line.length > 2 && line.length < 50 &&
          !line.match(/^\d+$/) &&
          !line.match(/invoice|date|number|total|tax|vat|account|acct|discount|subtotal|balance|phone|tel|fax|email|address|reg|vat\s*no/i) &&
          !line.match(/^[R$£€]/) &&
          !line.match(/^\d{2,}/) &&
          line.match(/[A-Za-z]{2,}/)
        ) {
          clientName = line.replace(/[|[\]]/g, "").trim();
          break;
        }
      }
    }

    const itemPatterns = [
      /^(\d+)\s+(.{2,60}?)\s+(?:R|ZAR|\$|£|€)\s*([\d,]+\.?\d*)\s+(?:R|ZAR|\$|£|€)\s*([\d,]+\.?\d*)$/i,
      /^(\d+)\s+(.{2,60}?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)$/,
      /^(.{2,60}?)\s+(\d+)\s+(?:x|@|\*)\s*(?:R|ZAR|\$|£|€)?\s*([\d,]+\.?\d*)/i,
    ];

    for (const line of lines) {
      const clean = line.replace(/[|[\]]/g, "").trim();
      let matched = false;

      for (const pattern of itemPatterns) {
        const itemMatch = clean.match(pattern);
        if (itemMatch) {
          const desc = (itemMatch[2] || itemMatch[1]).trim();
          if (!desc.match(/total|tax|vat|subtotal|discount|amount|date|invoice|account/i)) {
            items.push({
              description: desc,
              quantity: parseInt(itemMatch[1]) || 1,
              rate: parseFloat((itemMatch[3] || "0").replace(/,/g, "")) || 0,
            });
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        const priceOnLine = clean.match(/(.{2,40}?)\s+(?:R|ZAR|\$|£|€)\s*([\d,]+\.?\d+)/i);
        if (priceOnLine && !priceOnLine[1].match(/total|tax|vat|subtotal|discount|amount|date|invoice|account|subtotal/i)) {
          items.push({
            description: priceOnLine[1].replace(/[|[\]]/g, "").trim(),
            quantity: 1,
            rate: parseFloat(priceOnLine[2].replace(/,/g, "")) || 0,
          });
        }
      }
    }

    if (items.length === 0 && total > 0) {
      items.push({ description: "Scanned invoice total", quantity: 1, rate: total });
    }

    return { clientName, items, total, rawText: text };
  }, []);

  const isTextGarbled = (text: string): boolean => {
    const garbageChars = (text.match(/[|[\]{}\\]/g) || []).length;
    const totalChars = text.replace(/\s/g, "").length;
    if (totalChars === 0) return true;
    const garbageRatio = garbageChars / totalChars;
    const longWords = text.split(/\s+/).filter((w) => w.length > 8 && !w.match(/[aeiou]/i)).length;
    return garbageRatio > 0.05 || longWords > 5;
  };

  const runOCR = useCallback(async (imageBlob: Blob) => {
    setScanning(true);
    setProgress(0);
    setError("");
    setRawText(null);
    setTips(false);

    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(imageBlob);
      await worker.terminate();

      setRawText(data.text);

      if (!data.text || data.text.trim().length < 10) {
        setError("Could not read any text from this file. Please try a clearer image.");
        setScanning(false);
        return;
      }

      if (isTextGarbled(data.text)) {
        setError("Text quality is low. Results may be inaccurate — please check and edit the fields below.");
      }

      const result = parseInvoiceText(data.text);
      onScanResult(result);
    } catch (err) {
      setError("Failed to scan. Please try again.");
    }
    setScanning(false);
  }, [parseInvoiceText, onScanResult]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPDF) {
      setTips(false);
      setScanning(true);
      setProgress(0);
      setError("Converting PDF...");
      try {
        const imageBlob = await pdfToImage(file);
        const url = URL.createObjectURL(imageBlob);
        setPreview(url);
        setError("");
        await runOCR(imageBlob);
      } catch {
        setError("Failed to read PDF. Try saving it as an image (JPG/PNG) first.");
        setScanning(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    runOCR(file);
  }, [runOCR]);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-lg">&#x1F4F7;</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">AI Invoice Scanner</h3>
          <p className="text-xs text-gray-500">Scan a paper invoice with your camera or upload a photo/PDF</p>
        </div>
      </div>

      {tips && !preview && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-medium text-amber-800 mb-2">&#x1F4A1; Tips for best results:</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>&#x2022; Lay the invoice <b>flat</b> on a surface</li>
            <li>&#x2022; Make sure <b>all text is visible</b> — don&apos;t cover with hands</li>
            <li>&#x2022; Use <b>good lighting</b> (no shadows over text)</li>
            <li>&#x2022; Hold phone <b>directly above</b> (not at an angle)</li>
            <li>&#x2022; You can also <b>upload a PDF</b> invoice</li>
          </ul>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,application/pdf" onChange={handleFileChange} className="hidden" />
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
          <span>&#x1F4C1;</span> Upload Image / PDF
        </button>
      </div>

      {scanning && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>{error === "Converting PDF..." ? "Converting PDF..." : "Scanning invoice..."}</span>
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

      {error && error !== "Converting PDF..." && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}

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
