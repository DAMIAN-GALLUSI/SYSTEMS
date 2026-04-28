import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import translations, { Lang } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = 'preferred-language';

type LanguageContextValue = {
  lang: Lang;
  t: (path: string) => string;
  setLang: (l: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>((localStorage.getItem(LANGUAGE_STORAGE_KEY) as Lang) || 'en');

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (path: string) => {
    const parts = path.split('.');
    let obj: any = translations[lang] || translations.en;
    for (const p of parts) {
      if (!obj) return path;
      obj = obj[p];
    }
    return typeof obj === 'string' ? obj : path;
  };

  const value = useMemo(() => ({ lang, t, setLang }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
