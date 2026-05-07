import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '@/locales/en.json';
import hiTranslations from '@/locales/hi.json';
import knTranslations from '@/locales/kn.json';

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  kn: { translation: knTranslations },
};

// Get stored language from localStorage or default to English
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
  }
});

export default i18n;
