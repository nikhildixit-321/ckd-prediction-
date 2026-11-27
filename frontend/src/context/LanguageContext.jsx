import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({ lang: 'en', toggleLang: () => {} });

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

    const toggleLang = () => {
        const next = lang === 'en' ? 'hi' : 'en';
        setLang(next);
        localStorage.setItem('lang', next);
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLang = () => useContext(LanguageContext);
