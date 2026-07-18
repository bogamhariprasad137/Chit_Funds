import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
      },
      "settings": {
        "title": "System Settings",
        "description": "Configure global business naming and customer reminder templates.",
        "card_title": "General Configuration Dashboard",
        "business_label": "Business Name / Institution Naming",
        "business_desc": "This name will be dynamically written into all generated receipts and PDF audit invoices.",
        "telugu_template": "WhatsApp Reminder Template (Telugu)",
        "english_template": "WhatsApp Reminder Template (English)",
        "legend_title": "Dynamic Parameters Reference Map",
        "save_btn": "Save Preferences",
        "saving_btn": "Saving Preferences..."
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
      },
      "settings": {
        "title": "సిస్టమ్ సెట్టింగులు",
        "description": "గ్లోబల్ వ్యాపార నామకరణం మరియు కస్టమర్ రిమైండర్ టెంప్లేట్‌లను కాన్ఫిగర్ చేయండి.",
        "card_title": "సాధారణ కాన్ఫిగరేషన్ డాష్‌బోర్డ్",
        "business_label": "వ్యాపార పేరు / సంస్థ నామకరణం",
        "business_desc": "ఈ పేరు అన్ని ఉత్పత్తి చేయబడిన రసీదులు మరియు PDF ఆడిట్ ఇన్‌వాయిస్‌లలో డైనమిక్‌గా వ్రాయబడుతుంది.",
        "telugu_template": "వాట్సాప్ రిమైండర్ టెంప్లేట్ (తెలుగు)",
        "english_template": "వాట్సాప్ రిమైండర్ టెంప్లేట్ (ఇంగ్లీష్)",
        "legend_title": "డైనమిక్ పారామితుల సూచన పటం",
        "save_btn": "ఆప్షన్స్ సేవ్ చేయండి",
        "saving_btn": "ఆప్షన్స్ సేవ్ అవుతున్నాయి..."
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
