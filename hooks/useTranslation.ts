import { useEffect, useCallback } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { SETTINGS_KEY, DEFAULT_SETTINGS } from "~store";
import type { Settings, Locale } from "~types";
import { setLocale, detectBrowserLocale, t as translate } from "~i18n";

export function useTranslation() {
  const [settings, setSettings] = useStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);

  useEffect(() => {
    let localeToUse: Locale;
    if (settings.locale) {
      localeToUse = settings.locale;
    } else {
      localeToUse = detectBrowserLocale();
    }
    setLocale(localeToUse);
  }, [settings.locale]);

  const setTranslationLocale = useCallback(
    (locale: Locale) => {
      setSettings({ ...settings, locale });
    },
    [settings, setSettings]
  );

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      return translate(path, params);
    },
    // locale dependency is required to invalidate memoization when language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.locale]
  );

  return {
    t,
    locale: settings.locale,
    setLocale: setTranslationLocale,
  };
}
