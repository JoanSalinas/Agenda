import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";

export type LanguageCode = "ca" | "es" | "en";

export const translations = {
  ca,
  es,
  en,
} as const;

export type Translations = typeof ca;

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  icon?: any;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "ca", name: "Catalan", nativeName: "Català", flag: "", icon: require("../assets/images/catalonia.png") },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
];
