import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ua from '../locales/ua.json';
import pl from '../locales/pl.json';
import jp from '../locales/jp.json';
import en from '../locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ua: { translation: ua },
      pl: { translation: pl },
      jp: { translation: jp },
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
