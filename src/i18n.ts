import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
const resources = {
  en: {
    translation: {
      "app": {
        "title": "ChitLedger"
      },
      "header": {
        "toggle_te": "తెలుగు",
        "toggle_en": "EN"
      },
      "dashboard": {
        "title": "Dashboard",
        "description": "Overview of all active chit groups."
      }
    }
  },
  te: {
    translation: {
      "app": {
        "title": "ChitLedger"
      },
      "header": {
        "toggle_te": "తెలుగు",
        "toggle_en": "EN"
      },
      "dashboard": {
        "title": "డాష్‌బోర్డ్",
        "description": "అన్ని యాక్టివ్ చిట్ గ్రూపుల స్థూలదృష్టి."
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
