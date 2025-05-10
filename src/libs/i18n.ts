import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  ja: {
    translation: {
      greeting: 'こんにちは',
      // 他の日本語キー
    },
  },
  en: {
    translation: {
      greeting: 'Hello',
      // 他の英語キー
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.startsWith('ja') ? 'ja' : 'en',
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
  });

export default i18n;
