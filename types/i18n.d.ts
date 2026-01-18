import 'react-i18next';

// Import resources (your translation files)
import en from '../locales/en.json';
import sv from '../locales/sv.json';

// Define the resources shape
declare module 'react-i18next' {
  interface Resources {
    translation: typeof en | typeof sv;
  }
}
