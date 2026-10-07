import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import uk from '../locales/uk.json';
import pl from '../locales/pl.json';
import ja from '../locales/ja.json';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

// Resource keys are real BCP 47 codes (uk, ja), so Intl date formatting and
// i18next plural rules (one/few/many) work for every language.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      uk: { translation: uk },
      pl: { translation: pl },
      ja: { translation: ja },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true, // uk-UA -> uk
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Keep <html lang> in sync for screen readers and hyphenation
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
