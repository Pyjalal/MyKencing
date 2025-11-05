import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';

// Import translations
import en from '../i18n/en.json';
import ms from '../i18n/ms.json';

const resources = {
  en: {
    translation: en,
  },
  ms: {
    translation: ms,
  },
};

// Initialize with default language
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default to 'en', will be updated after settings load
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

// Function to update language after settings are loaded
export const updateI18nLanguage = async () => {
  try {
    const language = useSettingsStore.getState().settings.language;
    if (language && language !== i18n.language) {
      await i18n.changeLanguage(language);
    }
  } catch (error) {
    console.warn('Failed to update i18n language:', error);
  }
};

export default i18n;