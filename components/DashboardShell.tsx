import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "./AccountForms";

export function DashboardShell({ children, locale, owner, section, email, paymentPending = false }: { children: ReactNode; locale: "en" | "ru"; owner: boolean; section: string; email: string; paymentPending?: boolean }) {
  const ru = locale === "ru", prefix = ru ? "/ru" : "";
  const entries = owner ? [
    ["inquiries", "Заявки на сайты", "Website enquiries", "01"],
    ["students", "Ученики и доступ", "Students & access", "02"],
    ["feedback", "Сообщения учеников", "Student messages", "03"],
    ["course", "Мой курс", "My course", "04"],
    ["orders", "Мои покупки", "My purchases", "05"],
    ["settings", "Настройки", "Settings", "06"],
  ] : [
    ["course", "Мой курс", "My course", "01"],
    ["orders", "Мои покупки", "My purchases", "02"],
    ["settings", "Настройки", "Settings", "03"],
  ];
  const current = entries.find(entry => entry[0] === section)!;
  const descriptions: Record<string, [string, string]> = {
    inquiries: ["Выберите заявку, посмотрите задачу и ответьте клиенту.", "Choose a request, review the brief and reply to the client."],
    students: ["Найдите ученика, посмотрите прогресс и управляйте ручным доступом.", "Find a student, review progress and manage manual access."],
    feedback: ["Разберите вопросы по урокам и отметьте решённые обращения.", "Review lesson questions and mark completed conversations resolved."],
    course: ["Продолжите с нужного урока или вернитесь к программе.", "Continue your next lesson or return to the course roadmap."],
    orders: ["Ваши покупки и их статус.", "Your purchases and their status."],
    settings: ["Пароль, поддержка и параметры кабинета.", "Password, support and account settings."],
  };
  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <div className="dashboard-identity"><span className="dashboard-avatar" aria-hidden="true">G</span><div><strong>{owner ? (ru ? "Управление G-lab" : "G-lab workspace") : (ru ? "Личный кабинет" : "Your account")}</strong><span>{owner ? (ru ? "Владелец" : "Owner") : (ru ? "Ученик" : "Student")}</span></div></div>
      <nav aria-label={ru ? "Разделы кабинета" : "Account sections"}>{entries.map(([id, russian, en, number]) => <Link key={id} href={`${prefix}/account?section=${id}${paymentPending ? "&payment=pending" : ""}`} aria-current={section === id ? "page" : undefined}><span aria-hidden="true">{number}</span>{ru ? russian : en}</Link>)}</nav>
      <div className="dashboard-sidebar-bottom"><p>{email}</p><SignOutButton /><Link href={prefix || "/"}>{ru ? "На сайт ↗" : "Visit website ↗"}</Link></div>
    </aside>
    <div className="dashboard-workspace">
      <header className="dashboard-header"><p className="account-eyebrow">{owner ? (ru ? "G-LAB / КАБИНЕТ ВЛАДЕЛЬЦА" : "G-LAB / OWNER WORKSPACE") : "G-LAB / ACCOUNT"}</p><h1>{ru ? current[1] : current[2]}</h1><p>{descriptions[section][ru ? 0 : 1]}</p></header>
      <div className="dashboard-content">{children}</div>
    </div>
  </div>;
}
