import * as Localization from "expo-localization"; // Use expo-localization
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import enAreas from "../locales/en/areas.json";
import enCommon from "../locales/en/common.json";
import enLevels from "../locales/en/levels.json";
import enPrompts from "../locales/en/prompts.json";
import enSupplements from "../locales/en/supplements.json";
import enTips from "../locales/en/tips.json";
import svAreas from "../locales/sv/areas.json";
import svCommon from "../locales/sv/common.json";
import svLevels from "../locales/sv/levels.json";
import svPrompts from "../locales/sv/prompts.json";
import svSupplements from "../locales/sv/supplements.json";
import svTips from "../locales/sv/tips.json";

// Define resources for i18n
const resources = {
  en: {
    common: enCommon,
    tips: enTips,
    supplements: enSupplements,
    areas: enAreas,
    levels: enLevels,
    prompts: enPrompts
  },
  sv: {
    common: svCommon,
    tips: svTips,
    supplements: svSupplements,
    areas: svAreas,
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
i18next
  .use(customLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    defaultNS: "common", // Default namespace
    ns: ["common", "tips", "supplements", "areas", "levels", "prompts"], // Available namespaces
    interpolation: {
      escapeValue: false, // Not needed for React
    },
  });

 
export default i18next;
