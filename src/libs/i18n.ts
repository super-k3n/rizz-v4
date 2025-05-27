import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ja from '../../locales/ja.json';
import en from '../../locales/en.json';

const resources = {
  ja: { translation: ja },
  en: { translation: en },
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
