import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    appName: "HIM-RAKSHAK",
    subTitle: "NER Disaster Intelligence & Early Warning",
    dashboard: "Dashboard",
    riskMap: "GIS Risk Map",
    alerts: "Alert Management",
    roads: "Road Monitoring",
    reports: "Citizen Hazard Reports",
    analytics: "Predictive Analytics",
    settings: "System Settings",
    login: "Command Login",
    logout: "Logout",
    systemStatus: "SYSTEM OPERATIONAL",
    liveApi: "LIVE API",
    mockData: "MOCK DATA",
    criticalZones: "Critical Risk Zones",
    highRiskZones: "High Risk Zones",
    activeAlerts: "Active Alerts",
    roadsAffected: "Roads at Risk",
    rainfall24h: "24h Avg Rainfall",
    hazardReports: "Field Reports",
    emergencyPriority: "Emergency Response Priority",
    aiPrediction: "AI Landslide Risk Factors",
    recommendedAction: "Recommended Action",
    submitReport: "Report a Hazard",
    useLocation: "Acquire Geolocation",
    uploadMedia: "Drag & Drop Hazard Media",
  },
  hi: {
    appName: "हिम-रक्षक",
    subTitle: "उत्तर-पूर्वी क्षेत्र आपदा चेतावनी प्रणाली",
    dashboard: "डैशबोर्ड",
    riskMap: "जीआईएस जोखिम मानचित्र",
    alerts: "चेतावनी प्रबंधन",
    roads: "सड़क निगरानी",
    reports: "नागरिक आपदा रिपोर्ट",
    analytics: "पूर्वानुमान विश्लेषिकी",
    settings: "प्रणाली सेटिंग्स",
    login: "कमांड लॉगिन",
    logout: "लॉगआउट",
    systemStatus: "प्रणाली संचालित है",
    liveApi: "लाइव एपीआई",
    mockData: "मॉक डेटा",
    criticalZones: "गंभीर जोखिम क्षेत्र",
    highRiskZones: "उच्च जोखिम क्षेत्र",
    activeAlerts: "सक्रिय चेतावनियाँ",
    roadsAffected: "प्रभावित सड़कें",
    rainfall24h: "24 घंटे की औसत वर्षा",
    hazardReports: "नागरिक रिपोर्ट",
    emergencyPriority: "आपातकालीन प्रतिक्रिया प्राथमिकता",
    aiPrediction: "एआई भूस्खलन जोखिम कारक",
    recommendedAction: "अनुशंसित कार्रवाई",
    submitReport: "खतरे की रिपोर्ट करें",
    useLocation: "भू-स्थान प्राप्त करें",
    uploadMedia: "मीडिया फ़ाइल अपलोड करें",
  },
  as: {
    appName: "হিম-ৰক্ষক",
    subTitle: "উত্তৰ-পূৰ্বাঞ্চল দুৰ্যোগ আগতীয়া সকীয়ানি ব্যৱস্থা",
    dashboard: "ডেশ্ববৰ্ড",
    riskMap: "জি.আই.এছ. বিপদাশংকা মানচিত্ৰ",
    alerts: "সকীয়ানি ব্যৱস্থাপনা",
    roads: "পথ নিৰীক্ষণ",
    reports: "নাগৰিক দুৰ্যোগ প্ৰতিবেদন",
    analytics: "পূৰ্বানুমান বিশ্লেষণ",
    settings: "ব্যৱস্থা সংৰূপ",
    login: "কমান্ড লগইন",
    logout: "লগআউট",
    systemStatus: "ব্যৱস্থা সক্ৰিয় হৈ আছে",
    liveApi: "লাইভ এ.পি.আই.",
    mockData: "মক ডাটা",
    criticalZones: "সংকটজনক অঞ্চল",
    highRiskZones: "উচ্চ বিপদাশংকা অঞ্চল",
    activeAlerts: "সক্ৰিয় সকীয়ানি",
    roadsAffected: "প্রভাৱিত পথসমূহ",
    rainfall24h: "২৪ ঘণ্টাৰ গড় বৰষুণ",
    hazardReports: "ক্ষেত্ৰ প্ৰতিবেদন",
    emergencyPriority: "জৰুৰীকালীন প্ৰতিক্ৰিয়া অগ্ৰাধিকাৰ",
    aiPrediction: "এ.আই. ভূমিস্খলন কাৰকসমূহ",
    recommendedAction: "প্ৰস্তাবিত পদক্ষেপ",
    submitReport: "আপদৰ প্ৰতিবেদন দিয়ক",
    useLocation: "ভূ-অৱস্থান লাভ কৰক",
    uploadMedia: "মিডিয়া ফাইল আপলোড কৰক",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const t = (key) => translations[lang][key] || translations['en'][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
