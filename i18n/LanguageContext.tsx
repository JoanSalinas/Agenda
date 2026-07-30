import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { LanguageCode, SUPPORTED_LANGUAGES, translations } from "./index";

const LANGUAGE_KEY = "agenda_language";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "ca",
  setLanguage: async () => {},
  t: (path: string) => path,
  locale: "ca-ES",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("ca");

  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored && (stored === "ca" || stored === "es" || stored === "en")) {
          setLanguageState(stored as LanguageCode);
        }
      } catch (err) {
        console.warn("Failed to load language from storage:", err);
      }
    };
    loadStoredLanguage();
  }, []);

  const setLanguage = async (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (err) {
      console.warn("Failed to save language to storage:", err);
    }
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const currentDict = translations[language] || translations.ca;
    const fallbackDict = translations.ca;

    const keys = path.split(".");
    let value: any = currentDict;
    let fallbackValue: any = fallbackDict;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        value = undefined;
      }

      if (fallbackValue && typeof fallbackValue === "object" && key in fallbackValue) {
        fallbackValue = fallbackValue[key];
      } else {
        fallbackValue = undefined;
      }
    }

    let result = typeof value === "string" ? value : typeof fallbackValue === "string" ? fallbackValue : path;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), String(paramVal));
      });
    }

    return result;
  };

  const currentDict = translations[language] || translations.ca;
  const locale = currentDict.locale;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
