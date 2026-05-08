import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import faTranslation from './fa.json';
import enTranslation from './en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fa: { ...faTranslation },
      en: { ...enTranslation },
    },
    lng: 'fa', // زبان پیشفرض
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;
