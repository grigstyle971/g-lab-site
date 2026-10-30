"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "./LanguageProvider";
import { localizedHref } from "../lib/i18n/translate";

type LanguageSwitcherProps = { placement?: "global" | "navigation" };

export function LanguageSwitcher({ placement = "global" }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const query = useSearchParams();
  const mainShowcasePage = pathname === "/" || pathname === "/ru"
    || pathname === "/work" || pathname === "/ru/work";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    if (placement === "global" && mainShowcasePage) return;

    let frame = 0;
    try {
      const raw = sessionStorage.getItem("g-lab-language-position");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.path !== pathname) return;
      sessionStorage.removeItem("g-lab-language-position");

      const restore = () => {
        const element = saved.id ? document.getElementById(saved.id) : null;
        const top = element
          ? element.getBoundingClientRect().top + window.scrollY + saved.ratio * element.offsetHeight
          : saved.y;
        window.scrollTo({ top, left: 0, behavior: "instant" });
      };
      restore();
      frame = requestAnimationFrame(() => requestAnimationFrame(restore));
    } catch {}

    return () => cancelAnimationFrame(frame);
  }, [mainShowcasePage, pathname, placement]);

  const remember = (lang: "ru" | "en") => {
    document.cookie = `g-lab-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("main [id]"))
      .filter((element) => element.offsetHeight > 0 && element.getBoundingClientRect().top <= 100)
      .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
    const element = blocks[0];

    try {
      sessionStorage.setItem(
        "g-lab-language-position",
        JSON.stringify({
          path: localizedHref(pathname, lang),
          y: window.scrollY,
          id: element?.id,
          ratio: element
            ? (window.scrollY - (element.getBoundingClientRect().top + window.scrollY)) / element.offsetHeight
            : 0,
        }),
      );
    } catch {}
  };

  if (placement === "global" && mainShowcasePage) return null;

  const suffix = (query.size ? `?${query.toString()}` : "") + hash;
  const className = placement === "navigation"
    ? "site-language-bar site-language-switcher--nav"
    : `site-language-bar${mainShowcasePage ? " site-language-bar--home" : ""}`;

  return (
    <div className={className}>
      <span>{locale === "ru" ? "Язык сайта" : "Site language"}</span>
      <nav aria-label={locale === "ru" ? "Выбор языка" : "Choose language"}>
        {(["ru", "en"] as const).map((lang) => (
          <a
            key={lang}
            href={localizedHref(pathname, lang) + suffix}
            hrefLang={lang}
            lang={lang}
            aria-current={locale === lang ? "true" : undefined}
            onClick={() => remember(lang)}
          >
            {lang.toUpperCase()}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function LanguageNote() {
  return null;
}
