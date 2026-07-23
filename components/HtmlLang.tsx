"use client";

import { useEffect } from "react";

/** Sets <html lang> for crawlers/users after hydrate (root layout defaults to es). */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
