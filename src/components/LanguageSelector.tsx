"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, LANGUAGES } from "@/lib/useTranslation";

export default function LanguageSelector() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{current.flag}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); window.location.reload(); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-indigo-50 transition-colors ${lang === l.code ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}
            >
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded w-7 text-center">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
