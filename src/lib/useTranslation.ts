"use client";

import { useState, useEffect, useCallback } from "react";
import { translations } from "./translations";

const STORAGE_KEY = "gogo-language";
const DEFAULT_LANG = "en";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "af", label: "Afrikaans", flag: "AF" },
  { code: "zu", label: "isiZulu", flag: "ZU" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "pt", label: "Português", flag: "PT" },
];

function getInitialLang(): string {
  if (typeof window === "undefined") return DEFAULT_LANG;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
}

export function useTranslation() {
  const [lang, setLangState] = useState<string>(DEFAULT_LANG);

  useEffect(() => {
    setLangState(getInitialLang());
  }, []);

  const setLang = useCallback((code: string) => {
    setLangState(code);
    localStorage.setItem(STORAGE_KEY, code);
    document.documentElement.lang = code;
  }, []);

  const t = useCallback(
    (section: string, key: string): string => {
      return translations[lang]?.[section]?.[key] || translations[DEFAULT_LANG]?.[section]?.[key] || key;
    },
    [lang]
  );

  return { lang, setLang, t };
}
