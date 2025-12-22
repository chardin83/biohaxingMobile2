import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization"; // Use expo-localization
import enCommon from "../locales/en/common.json";
import enTips from "../locales/en/tips.json";
import enSupplements from "../locales/en/supplements.json";
import svCommon from "../locales/sv/common.json";
import svTips from "../locales/sv/tips.json";
import svSupplements from "../locales/sv/supplements.json";
import svLevels from "../locales/sv/levels.json";
import enLevels from "../locales/en/levels.json";
import enPrompts from "../locales/en/prompts.json";
import svPrompts from "../locales/sv/prompts.json";

// Define resources for i18n
const resources = {
  en: {
    common: enCommon,
    tips: enTips,
    supplements: enSupplements,
    levels: enLevels,
    prompts: enPrompts
  },
  sv: {
    common: svCommon,
    tips: svTips,
    supplements: svSupplements,
    levels: svLevels,
    prompts: svPrompts
  },
};

console.log("RAW", svSupplements.supplements?.[0]?.name);
// Custom Language Detector for Expo
const customLanguageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: (callback: (language: string) => void) => {
    const locales = Localization.getLocales();
    const locale = locales[0]?.languageCode ?? "sv";
    console.log("Language chosen for i18n:", locale);
    callback(locale);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

// Initialize i18n
i18n
  .use(customLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    defaultNS: "common", // Default namespace
    ns: ["common", "tips", "supplements", "levels", "prompts"], // Available namespaces
    interpolation: {
      escapeValue: false, // Not needed for React
    },
  });

export default i18n;
