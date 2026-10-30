import Link from "next/link";
import type { ReactNode } from "react";
import "../app/account.css";
export function AccountLayout({
  children,
  locale = "en",
  dashboard = false,
}: {
  children: ReactNode;
  locale?: "en" | "ru";
  dashboard?: boolean;
}) {
  const ru = locale === "ru",
    prefix = ru ? "/ru" : "";
  return (
    <div className={`account-page${dashboard ? " account-page--dashboard" : ""}`}>
      <nav className="account-nav">
        <Link href={prefix || "/"} className="brand">
          G<span>-</span>lab
        </Link>
        <Link href={`${prefix}/courses/build-with-codex`}>
          {ru ? "О курсе" : "About the course"}
        </Link>
        <Link href={`${prefix}/account`}>
          {ru ? "Личный кабинет" : "My account"}
        </Link>
      </nav>
      <main className="account-main">{children}</main>
      <footer className="account-footer">
        <span>G-lab · {ru ? "Практический курс" : "Practical course"}</span>
        <nav aria-label={ru ? "Правовая информация" : "Policies"}>
          <Link href={`${prefix}/about`}>{ru ? "О G-lab" : "About G-lab"}</Link>
          <Link href={`${prefix}/privacy`}>{ru ? "Данные и конфиденциальность" : "Privacy notice"}</Link>
          <Link href={`${prefix}/terms`}>{ru ? "Условия курса" : "Course terms"}</Link>
        </nav>
        <a href="mailto:glab.tech.support@gmail.com">glab.tech.support@gmail.com</a>
      </footer>
    </div>
  );
}
