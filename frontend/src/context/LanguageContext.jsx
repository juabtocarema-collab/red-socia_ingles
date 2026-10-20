import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // English is the default language as requested: "TODO EN INGLES CON UN BOTON O BARIOS PARA QUE PASE A ESPAÑOL"
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('sena_lang') || 'en';
  });

  const [dataPolicyModalOpen, setDataPolicyModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sena_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  function setLanguage(lang) {
    if (lang === 'en' || lang === 'es') {
      setLanguageState(lang);
    }
  }

  function toggleLanguage() {
    setLanguageState(prev => (prev === 'en' ? 'es' : 'en'));
  }

  // Translation helper function
  function t(path, params = {}) {
    const keys = path.split('.');
    let current = translations[language] || translations.en;

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return path; // Return key if not found
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current === 'string') {
      let str = current;
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
      return str;
    }

    return current;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        translations: translations[language] || translations.en,
        dataPolicyModalOpen,
        setDataPolicyModalOpen
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
