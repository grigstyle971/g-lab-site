"use client";

import { useEffect, useState } from "react";
import { ArrowIcon } from "./ArrowIcon";

type ProjectBrief = {
  inquiryMode?: "quick";
  audience: string;
  pages: string[];
  customPages: string;
  features: string[];
  customFeatures: string;
  visualStyle: string;
  references: string;
  assets: string;
  domain: string;
  existingTools: string;
};
type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  project_type: string;
  summary: string;
  project_brief: ProjectBrief;
  estimated_min_usd: number;
  estimated_max_usd: number;
  timeline: string;
  budget_range: string;
  locale: "en" | "ru";
  status: "new" | "replied" | "closed";
};

const pageNames: Record<string, [string, string]> = {
  home: ["Главная", "Home"], about: ["О компании", "About"], services: ["Услуги", "Services"],
  product: ["Товары / продукты", "Products"], work: ["Портфолио", "Portfolio"], pricing: ["Цены", "Pricing"],
  faq: ["Вопросы и ответы", "FAQ"], contact: ["Контакты", "Contact"], blog: ["Статьи / новости", "Blog / news"],
  account: ["Личный кабинет", "Client account"], other: ["Другая страница", "Other page"], unsure: ["Пока не знаю", "Not sure yet"],
};
const featureNames: Record<string, [string, string]> = {
  form: ["Формы заявок", "Enquiry forms"], booking: ["Запись / бронирование", "Booking / scheduling"],
  payments: ["Оплата онлайн", "Online payments"], accounts: ["Аккаунты клиентов", "Customer accounts"],
  catalog: ["Каталог / фильтры", "Catalogue / filters"], search: ["Поиск", "Search"], languages: ["Несколько языков", "Multiple languages"],
  cms: ["Блог / редактирование контента", "Blog / content editing"], admin: ["Админ-панель", "Admin dashboard"],
  analytics: ["Аналитика", "Analytics"], integrations: ["Интеграции", "Integrations"], other: ["Другая функция", "Other feature"], unsure: ["Пока не знаю", "Not sure yet"],
};
const styleNames: Record<string, [string, string]> = {
  minimal: ["Минималистичный", "Minimal"], premium: ["Премиальный", "Premium"], bold: ["Смелый и выразительный", "Bold and expressive"],
  cinematic: ["Кинематографичный / технологичный", "Cinematic / technology-led"], friendly: ["Дружелюбный", "Friendly"],
  reference: ["Есть примеры", "Has references"], unsure: ["Нужна помощь с выбором", "Needs visual guidance"],
};
const assetNames: Record<string, [string, string]> = {
  ready: ["Материалы готовы", "Assets ready"], partial: ["Есть часть материалов", "Some assets ready"],
  "need-help": ["Нужна помощь с материалами", "Needs help with assets"], unsure: ["Пока не знает", "Not sure yet"],
};
const domainNames: Record<string, [string, string]> = {
  have: ["Есть домен / хостинг", "Has domain / hosting"], need: ["Нужно помочь настроить", "Needs setup help"], unsure: ["Пока не знает", "Not sure yet"],
};
const timelineNames: Record<string, [string, string]> = {
  "not-specified": ["Не обсуждался", "Not discussed"],
  soon: ["Как можно скорее", "As soon as possible"], month: ["В течение месяца", "Within a month"], planning: ["Пока планирует", "Just exploring"],
};
const budgetNames: Record<string, [string, string]> = {
  "not-specified": ["Не обсуждался", "Not discussed"],
  "under-1000": ["До $1,000", "Under $1,000"], "1000-3000": ["$1,000–3,000", "$1,000–3,000"],
  "3000-plus": ["$3,000+", "$3,000+"], "not-sure": ["Пока не знает", "Not sure yet"],
};

function line(label: string, value: string) { return `${label}: ${value || "—"}`; }
function inquiryText(item: Inquiry, ru: boolean) {
  const brief = item.project_brief;
  if (brief.inquiryMode === "quick") return [ru ? "G-LAB / КОРОТКАЯ ЗАЯВКА" : "G-LAB / SHORT REQUEST", line(ru ? "Контакт" : "Contact", `${item.name} <${item.email}>`), line(ru ? "Задача" : "Request", item.summary), ru ? "Объём, сроки и бюджет ещё не обсуждались." : "Scope, timing and budget have not been discussed."].join("\n");
  const join = (values: string[], names: Record<string, [string, string]>) => values.map((value) => names[value]?.[ru ? 0 : 1] || value).join(", ");
  return [
    ru ? "G-LAB / БРИФ ПРОЕКТА" : "G-LAB / PROJECT BRIEF",
    line(ru ? "Контакт" : "Contact", `${item.name} <${item.email}>`),
    line(ru ? "Тип проекта" : "Project type", item.project_type),
    line(ru ? "Предварительный диапазон" : "Preliminary estimate", `$${item.estimated_min_usd.toLocaleString("en-US")}–$${item.estimated_max_usd.toLocaleString("en-US")} USD`),
    line(ru ? "Задача и результат" : "Goal and outcome", item.summary),
    line(ru ? "Аудитория" : "Audience", brief.audience),
    line(ru ? "Страницы" : "Pages", `${join(brief.pages, pageNames)}${brief.customPages ? `; ${brief.customPages}` : ""}`),
    line(ru ? "Функции" : "Features", `${join(brief.features, featureNames)}${brief.customFeatures ? `; ${brief.customFeatures}` : ""}`),
    line(ru ? "Стиль" : "Style", styleNames[brief.visualStyle]?.[ru ? 0 : 1] || brief.visualStyle),
    line(ru ? "Примеры" : "References", brief.references),
    line(ru ? "Материалы" : "Assets", assetNames[brief.assets]?.[ru ? 0 : 1] || brief.assets),
    line(ru ? "Домен" : "Domain", domainNames[brief.domain]?.[ru ? 0 : 1] || brief.domain),
    line(ru ? "Сервисы и интеграции" : "Tools and integrations", brief.existingTools),
    line(ru ? "Срок" : "Timeline", timelineNames[item.timeline]?.[ru ? 0 : 1] || item.timeline),
    line(ru ? "Бюджет" : "Budget", budgetNames[item.budget_range]?.[ru ? 0 : 1] || item.budget_range),
  ].join("\n");
}

export function OwnerProjectInbox({ ru }: { ru: boolean }) {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Inquiry["status"] | "all">("all");
  const [selectedId, setSelectedId] = useState("");
  async function load() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/project-inquiries", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "inbox");
      setItems(result.items || []);
      setLoaded(true);
    } catch {
      setMessage(ru ? "Не удалось загрузить заявки. Обновите список или проверьте настройки кабинета." : "Could not load requests. Refresh the list or check workspace settings.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { void load(); }, []);
  async function setStatus(id: string, status: Inquiry["status"]) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/project-inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error();
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch {
      setMessage(ru ? "Не удалось сохранить статус." : "Could not save the status.");
    } finally {
      setBusy(false);
    }
  }
  async function copyBrief(item: Inquiry) {
    try {
      await navigator.clipboard.writeText(inquiryText(item, ru));
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId((current) => current === item.id ? "" : current), 1800);
    } catch {
      setMessage(ru ? "Не удалось скопировать бриф. Откройте полный бриф и скопируйте текст вручную." : "Could not copy the brief. Open it and copy the text manually.");
    }
  }
  const typeLabel: Record<string, string> = ru
    ? { website: "Сайт для бизнеса", landing: "Лендинг", portal: "Портал", automation: "Автоматизация", other: "Другое" }
    : { website: "Business website", landing: "Landing page", portal: "Client portal", automation: "AI workflow", other: "Other" };
  const statusLabel: Record<Inquiry["status"], string> = ru
    ? { new: "Новая", replied: "Ответил", closed: "Закрыта" }
    : { new: "New", replied: "Replied", closed: "Closed" };
  const styleLabel = (key: string) => styleNames[key]?.[ru ? 0 : 1] || key;
  const assetLabel = (key: string) => assetNames[key]?.[ru ? 0 : 1] || key;
  const domainLabel = (key: string) => domainNames[key]?.[ru ? 0 : 1] || key;
  const timelineLabel = (key: string) => timelineNames[key]?.[ru ? 0 : 1] || key;
  const budgetLabel = (key: string) => budgetNames[key]?.[ru ? 0 : 1] || key;
  const term = search.trim().toLocaleLowerCase();
  const visible = items.filter(item => (filter === "all" || item.status === filter) && `${item.name} ${item.email} ${item.summary}`.toLocaleLowerCase().includes(term));
  const selected = visible.find(item => item.id === selectedId) || visible[0];
  const brief = selected?.project_brief;
  return <section className="inquiry-workspace" aria-label={ru ? "Работа с заявками" : "Request workspace"} aria-busy={busy}>
    <p className="inquiry-source-note">{ru ? "Последние 100 заявок с сайта. Счётчики и поиск относятся к загруженному списку." : "The latest 100 website requests. Counts and search apply to the loaded list."}</p>
    <div className="inquiry-toolbar"><label>{ru ? "Поиск в загруженных заявках" : "Search loaded requests"}<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={ru ? "Имя, почта или задача" : "Name, email or request"} /></label><button type="button" onClick={() => void load()} disabled={busy}>{busy ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Обновить список" : "Refresh list")}</button></div>
    <div className="inquiry-filters" role="group" aria-label={ru ? "Фильтр по статусу" : "Filter by status"}>{(["all", "new", "replied", "closed"] as const).map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setSelectedId(""); }}>{value === "all" ? (ru ? "Все" : "All") : statusLabel[value]}<span>{loaded ? items.filter(item => value === "all" || item.status === value).length : "—"}</span></button>)}</div>
    <p role="status" className="inquiry-load-status">{message || (!loaded && busy ? (ru ? "Загружаем заявки…" : "Loading requests…") : "")}</p>
    {loaded && !message && visible.length === 0 && <div className="dashboard-empty"><h2>{items.length === 0 ? (ru ? "Заявок пока нет" : "No requests yet") : (ru ? "Ничего не найдено" : "No matching requests")}</h2><p>{items.length === 0 ? (ru ? "Заявки с сайта появятся здесь. Новые обращения можно будет открыть, скопировать и обработать." : "Website requests will appear here. Open a request to review, copy and respond.") : (ru ? "Попробуйте другой запрос или выберите другой статус." : "Try another search or status filter.")}</p></div>}
    {selected && brief && <div className="inquiry-split">
      <ul className="inquiry-list" aria-label={ru ? "Список заявок" : "Request list"}>{visible.map(item => <li key={item.id}><button type="button" aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)} aria-controls="selected-inquiry">
        <span className="inquiry-row-top"><strong>{item.name}</strong><span className={`inquiry-status inquiry-status--${item.status}`}>{statusLabel[item.status]}</span></span>
        <span className="inquiry-row-email">{item.email}</span><span className="inquiry-row-summary">{item.summary}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(ru ? "ru-RU" : "en-GB")}</time>
      </button></li>)}</ul>
      <article className="inquiry-detail" id="selected-inquiry" aria-labelledby="inquiry-detail-name">
        <div className="inquiry-detail-head"><div><p className="account-eyebrow">{brief.inquiryMode === "quick" ? (ru ? "КОРОТКАЯ ЗАЯВКА" : "SHORT REQUEST") : typeLabel[selected.project_type]}</p><h2 id="inquiry-detail-name">{selected.name}</h2><time dateTime={selected.created_at}>{new Date(selected.created_at).toLocaleString(ru ? "ru-RU" : "en-GB")}</time></div><label>{ru ? "Статус заявки" : "Request status"}<select value={selected.status} disabled={busy} onChange={event => void setStatus(selected.id, event.target.value as Inquiry["status"])}>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
        <div className="inquiry-detail-actions"><a href={`mailto:${selected.email}?subject=${encodeURIComponent(ru ? "Ваш проект в G-lab" : "Your G-lab project")}`} className="account-primary">{ru ? "Ответить клиенту" : "Reply to client"}<ArrowIcon /></a><button type="button" onClick={() => void copyBrief(selected)}>{copiedId === selected.id ? (ru ? "Скопировано" : "Copied") : (ru ? "Скопировать заявку" : "Copy request")}</button></div>
        <a className="inquiry-client-email" href={`mailto:${selected.email}`}>{selected.email}</a>
        <div className="inquiry-goal"><h3>{ru ? "Задача клиента" : "Client request"}</h3><p>{selected.summary}</p></div>
        {brief.inquiryMode === "quick" ? <p className="inquiry-scope-note">{ru ? "Это первый контакт. Объём работ, бюджет и сроки ещё не обсуждались." : "This is an initial enquiry. Scope, budget and timing have not been discussed yet."}</p> : <>
          <div className="inquiry-estimate"><span>{ru ? "Предварительный ориентир" : "Preliminary estimate"}</span><strong>${selected.estimated_min_usd.toLocaleString("en-US")}–${selected.estimated_max_usd.toLocaleString("en-US")} USD</strong><small>{ru ? "Фиксированную смету согласовать до начала работ." : "Agree on a fixed quote before work starts."}</small></div>
          <details className="inquiry-brief" open><summary>{ru ? "Подробный бриф" : "Full brief"}</summary><dl>
            <div><dt>{ru ? "Аудитория" : "Audience"}</dt><dd>{brief.audience || "—"}</dd></div>
            <div><dt>{ru ? "Страницы" : "Pages"}</dt><dd>{[...brief.pages.map(key => pageNames[key]?.[ru ? 0 : 1] || key), brief.customPages].filter(Boolean).join(", ") || "—"}</dd></div>
            <div><dt>{ru ? "Функции" : "Features"}</dt><dd>{[...brief.features.map(key => featureNames[key]?.[ru ? 0 : 1] || key), brief.customFeatures].filter(Boolean).join(", ") || "—"}</dd></div>
            <div><dt>{ru ? "Стиль" : "Style"}</dt><dd>{styleLabel(brief.visualStyle)}</dd></div>
            <div><dt>{ru ? "Примеры" : "References"}</dt><dd>{brief.references || "—"}</dd></div>
            <div><dt>{ru ? "Материалы" : "Assets"}</dt><dd>{assetLabel(brief.assets)}</dd></div>
            <div><dt>{ru ? "Домен / хостинг" : "Domain / hosting"}</dt><dd>{domainLabel(brief.domain)}</dd></div>
            <div><dt>{ru ? "Интеграции" : "Integrations"}</dt><dd>{brief.existingTools || "—"}</dd></div>
            <div><dt>{ru ? "Срок" : "Timing"}</dt><dd>{timelineLabel(selected.timeline)}</dd></div>
            <div><dt>{ru ? "Бюджет" : "Budget"}</dt><dd>{budgetLabel(selected.budget_range)}</dd></div>
          </dl></details>
        </>}
      </article>
    </div>}
  </section>;
}
