"use client";

// Locale provider — HY/RU/EN without losing query/case/draft context.
// The locale lives here + localStorage (never in the URL), so switching the
// language does not navigate or reset any view state. Deep legacy views keep
// their Armenian strings for now (see dictionaries.ts scope note).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from "./dictionaries";

const STORAGE_KEY = "gp.locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: getDictionary(DEFAULT_LOCALE),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Two-pass hydration-safe init: the server renders the default locale; the
    // saved choice is applied asynchronously (setTimeout keeps the setState out
    // of the synchronous effect body — no cascading render on mount).
    let saved: Locale | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(raw)) saved = raw;
    } catch {
      /* private mode — default locale */
    }
    if (saved === null || saved === DEFAULT_LOCALE) return;
    const id = window.setTimeout(() => setLocaleState(saved as Locale), 0);
    return () => window.clearTimeout(id);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: getDictionary(locale) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
