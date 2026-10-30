import { Suspense } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Page = "home" | "work" | "services" | "course" | "about";

// Shared header and footer for the public pages in the G-lab "site assembles itself" style.
export function GlNav({ ru, current = "home" }: { ru: boolean; current?: Page }) {
  const prefix = ru ? "/ru" : "";
  const links: [Page, string, string][] = [
    ["work", `${prefix}/work`, ru ? "Работы" : "Work"],
    ["services", `${prefix}/websites-for-businesses`, ru ? "Услуги" : "Services"],
    ["course", `${prefix}/courses/build-with-codex`, ru ? "Курс" : "Course"],
    ["about", `${prefix}/about`, ru ? "О студии" : "About"],
  ];
  return (
    <nav className="gl-nav" aria-label={ru ? "Навигация сайта" : "Site navigation"}>
      <Link href={prefix || "/"} className="gl-brand">G<b>-</b>lab</Link>
      <div className="gl-links">
        {links.map(([page, href, label]) => <Link key={page} href={href} aria-current={current === page ? "page" : undefined}>{label}</Link>)}
      </div>
      <div className="gl-util">
        <Suspense fallback={null}><LanguageSwitcher placement="navigation" /></Suspense>
        <Link className="gl-account" href={`${prefix}/account`}>{ru ? "Кабинет" : "Account"}</Link>
        <Link className="gl-btn gl-btn--ink gl-btn--sm" href={`${prefix}/#contact`}>
          <span className="gl-cta-full">{ru ? "Обсудить проект" : "Start a project"}</span>
          <span className="gl-cta-short">{ru ? "Связаться" : "Contact"}</span>
        </Link>
      </div>
    </nav>
  );
}

export function GlFooter({ ru }: { ru: boolean }) {
  const prefix = ru ? "/ru" : "";
  return (
    <footer className="gl-foot">
      <div className="gl-wrap">
        <p className="gl-mark" aria-hidden="true">G<b>-</b>lab</p>
        <div className="gl-flinks">
          <span>© 2026 G-lab Agency</span>
          <div>
            <Link href={`${prefix}/work`}>{ru ? "Работы" : "Work"}</Link>
            <Link href={`${prefix}/about`}>{ru ? "О студии" : "About"}</Link>
            <a href="mailto:glab.tech.support@gmail.com">glab.tech.support@gmail.com</a>
            <Link href={`${prefix}/privacy`}>{ru ? "Данные" : "Privacy"}</Link>
            <Link href={`${prefix}/terms`}>{ru ? "Условия курса" : "Course terms"}</Link>
            <a href="https://www.instagram.com/g.lab.agency/" target="_blank" rel="noopener noreferrer" translate="no">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
