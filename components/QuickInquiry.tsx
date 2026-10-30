"use client";

import { useRef, useState, type FormEvent } from "react";
import { useLocale } from "./LanguageProvider";
import { marketingEvent } from "../lib/marketing-events";
import { captureCampaignAttribution } from "../lib/campaign-attribution";

export function QuickInquiry() {
  const ru = useLocale() === "ru";
  const text = (en: string, russian: string) => ru ? russian : en;
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || sent) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/project-inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "quick", name: form.get("name"), email: form.get("email"), summary: form.get("summary"), website: form.get("website"), consent: form.get("consent") === "on", locale: ru ? "ru" : "en", attribution: captureCampaignAttribution() }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        marketingEvent("inquiry_failed", "quick");
        setError(result.error === "limit"
          ? text("Several requests were sent recently. Please try later or email glab.tech.support@gmail.com.", "Недавно отправлено несколько заявок. Попробуйте позже или напишите на glab.tech.support@gmail.com.")
          : text("Your request was not saved. Please retry or email glab.tech.support@gmail.com.", "Заявка не сохранена. Повторите попытку или напишите на glab.tech.support@gmail.com."));
        return;
      }
      setSent(true);
      marketingEvent("inquiry_submitted", "quick");
    } catch {
      marketingEvent("inquiry_failed", "quick");
      setError(text("Connection failed. Please retry or email glab.tech.support@gmail.com.", "Нет связи с сервером. Повторите попытку или напишите на glab.tech.support@gmail.com."));
    } finally { setBusy(false); }
  }

  return <section className="quick-inquiry" aria-labelledby="quick-inquiry-title">
    <p className="eyebrow">{text("START WITH A SHORT MESSAGE", "НАЧНИТЕ С КОРОТКОГО СООБЩЕНИЯ")}</p>
    <h3 id="quick-inquiry-title">{text("Tell me what you have in mind.", "Расскажите о вашей задаче.")}</h3>
    <p>{text("Send the essentials. We can discuss pages, features and budget by email.", "Отправьте самое важное. Страницы, функции и бюджет обсудим по почте.")}</p>
    {sent ? <p className="project-inquiry-success" role="status">{text("Your request is saved. I’ll review it and reply by email.", "Заявка сохранена. Я изучу задачу и отвечу на почту.")}</p> : <form onSubmit={submit} onFocusCapture={() => { if (!started.current) { started.current = true; marketingEvent("inquiry_started", "quick"); } }}>
      <div className="quick-inquiry-fields project-inquiry-details">
        <label>{text("Name (optional)", "Имя (необязательно)")}<input name="name" autoComplete="name" maxLength={120} /></label>
        <label>{text("Email for the reply", "Почта для ответа")}<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label className="quick-inquiry-summary">{text("What does your business need?", "Что нужно вашему бизнесу?")}<textarea name="summary" required minLength={3} maxLength={3000} rows={4} /></label>
      </div>
      <label className="project-inquiry-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="project-inquiry-consent"><input name="consent" type="checkbox" required /> <span>{text("I agree to the ", "Я согласен с ")}<a href={`${ru ? "/ru" : ""}/privacy`}>{text("privacy notice", "уведомлением о данных")}</a>{text(". My details are used to respond to this request.", ". Мои данные используются для ответа на заявку.")}</span></label>
      <p role="alert" className="project-inquiry-status">{error}</p>
      <button className="project-inquiry-next" type="submit" disabled={busy}>{busy ? text("Sending…", "Отправляем…") : text("Send request", "Отправить заявку")}</button>
    </form>}
  </section>;
}
