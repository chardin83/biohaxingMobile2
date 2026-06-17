export const LANGUAGE_DISPLAY = {
  en: 'English',
  sv: 'Svenska',
} as const;

export type LanguageCode = keyof typeof LANGUAGE_DISPLAY | 'device';

export default LANGUAGE_DISPLAY;
