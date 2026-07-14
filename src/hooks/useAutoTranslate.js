import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';

const cache = new Map(); // key: `${lang}:${text}`

const normaliseTexts = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((item) => {
    if (item === null || item === undefined) return '';
    return String(item);
  });
};

/**
 * Auto-translate a list of strings when language changes, caching results per language/text.
 * Returns translations in the same order.
 */
export const useAutoTranslate = (texts) => {
  const { language, translateDynamic, autoTranslate } = usePreferences();
  const normalised = useMemo(() => normaliseTexts(texts), [texts]);
  const [translations, setTranslations] = useState(normalised);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (language === 'en' || !autoTranslate) {
      setTranslations(normalised);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          normalised.map(async (text) => {
            if (!text) return '';
            const cacheKey = `${language}:${text}`;
            if (cache.has(cacheKey)) {
              return cache.get(cacheKey);
            }
            const translated = await translateDynamic(text, language, 'en');
            cache.set(cacheKey, translated);
            return translated;
          }),
        );
        if (!cancelled) {
          setTranslations(results);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [autoTranslate, language, normalised, translateDynamic]);

  return { translations, loading };
};

export default useAutoTranslate;
