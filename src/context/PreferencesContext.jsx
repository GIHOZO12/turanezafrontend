import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translateText } from '../api/translate';

const TRANSLATIONS = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.groups': 'Groups',
    'nav.plots': 'Plots',
    'nav.properties': 'Properties',
    'nav.investments': 'Investments',
    'nav.legal': 'Legal',
    'nav.account': 'Account',
    'nav.help': 'Help',
    'menu.greeting': 'Aspiring investor',
    'menu.theme.light': 'Daily mode',
    'menu.theme.dark': 'Dark mode',
    'menu.theme.label': 'Theme',
    'menu.language.label': 'Language',
    'menu.logout': 'Log out',
    'menu.viewProfile': 'View account',
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.groups': 'Groupes',
    'nav.plots': 'Parcelles',
    'nav.properties': 'Biens',
    'nav.investments': 'Investissements',
    'nav.legal': 'Juridique',
    'nav.account': 'Compte',
    'nav.help': 'Aide',
    'menu.greeting': 'Investisseur·se',
    'menu.theme.light': 'Mode jour',
    'menu.theme.dark': 'Mode nuit',
    'menu.theme.label': 'Thème',
    'menu.language.label': 'Langue',
    'menu.logout': 'Se déconnecter',
    'menu.viewProfile': 'Voir le compte',
  },
  rw: {
    'nav.dashboard': 'Dashibodi',
    'nav.groups': 'Amatsinda',
    'nav.plots': 'Ibibanza',
    'nav.properties': 'Inyubako',
    'nav.investments': 'Ishoramari',
    'nav.legal': 'Amategeko',
    'nav.account': 'Konti',
    'nav.help': 'Ubufasha',
    'menu.greeting': 'Umushoramari',
    'menu.theme.light': 'Mode y\'umunsi',
    'menu.theme.dark': 'Mode y\'ijoro',
    'menu.theme.label': 'Insakazamibare',
    'menu.language.label': 'Ururimi',
    'menu.logout': 'Gusohoka',
    'menu.viewProfile': 'Reba konti',
  },
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'rw', label: 'Kinyarwanda' },
];

export const PreferencesContext = createContext({
  theme: 'light',
  language: 'en',
  autoTranslate: false,
  setTheme: () => {},
  toggleTheme: () => {},
  setLanguage: () => {},
  translate: (key, fallback) => fallback || key,
  translateDynamic: async () => '',
  setAutoTranslate: () => {},
  languages: LANGUAGES,
});

const isBrowser = typeof window !== 'undefined';

const readLocal = (key, fallback) => {
  if (!isBrowser) return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // no-op
  }
};

export const PreferencesProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => (readLocal('uig-theme', 'light') === 'dark' ? 'dark' : 'light'));
  const [language, setLanguage] = useState(() => {
    const stored = readLocal('uig-language', 'en');
    return LANGUAGES.some((lang) => lang.code === stored) ? stored : 'en';
  });
  const [autoTranslate, setAutoTranslate] = useState(false);

  useEffect(() => {
    writeLocal('uig-theme', theme);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  }, [theme]);

  useEffect(() => {
    writeLocal('uig-language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  useEffect(() => {
    // Ensure legacy setting is cleared and only opt-in when explicitly toggled.
    writeLocal('uig-auto-translate', autoTranslate ? 'true' : 'false');
  }, [autoTranslate]);

  const translate = useCallback(
    (key, fallback) => {
      const dictionary = TRANSLATIONS[language] || TRANSLATIONS.en;
      return dictionary[key] || TRANSLATIONS.en[key] || fallback || key;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      theme,
      language,
      autoTranslate,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setLanguage,
      translate,
      translateDynamic: async (text, target = language, source = 'en') => {
        try {
          const result = await translateText({ text, target, source });
          return result?.translated_text || text;
        } catch (error) {
          return text;
        }
      },
      setAutoTranslate,
      languages: LANGUAGES,
    }),
    [language, theme, autoTranslate, translate],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);
