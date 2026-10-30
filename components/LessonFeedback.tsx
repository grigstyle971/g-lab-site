"use client";
import { useState, type FormEvent } from "react";
import { useLocale } from "./LanguageProvider";
export function LessonFeedback({ slug }: { slug: string }) {
  const ru = useLocale() === "ru";
  const [step, setStep] = useState(""),
    [message, setMessage] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/account/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, step, message }),
      });
      const b = await r.json();
      if (!r.ok) {
        setStatus(
          ru
            ? b.error === "signin"
              ? "Войдите в аккаунт, чтобы отправить отзыв."
              : b.error === "limit"
                ? "Сегодня уже отправлено 10 сообщений. Попробуйте завтра."
                : "Не удалось отправить. Текст сохранён на странице; можно написать glab.tech.support@gmail.com."
            : b.error === "signin"
              ? "Sign in to send feedback."
              : b.error === "limit"
                ? "You have sent 10 messages today. Please try tomorrow."
                : "Could not send. Your text is still here; contact glab.tech.support@gmail.com.",
        );
        return;
      }
      setMessage("");
      setStatus(
        ru
          ? "Спасибо! Сообщение появилось у автора курса."
          : "Thank you! Your message is in the course owner’s inbox.",
      );
    } catch {
      setStatus(
        ru
          ? "Нет связи. Попробуйте ещё раз."
          : "Connection failed. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="lesson-feedback">
      <summary>
        {ru
          ? "Здесь непонятно — сообщить автору"
          : "Something unclear? Tell the author"}
      </summary>
      <p>
        {ru
          ? "Укажите шаг и что именно помешало. Сообщение увидит автор вместе с почтой вашего аккаунта. Не добавляйте пароли и данные клиентов."
          : "Name the step and what got in the way. The author will see your message and account email. Do not include passwords or customer data."}
      </p>
      <form onSubmit={submit}>
        <label>
          {ru ? "Шаг или заголовок раздела" : "Step or section title"}
          <input
            required
            maxLength={120}
            value={step}
            onChange={(e) => setStep(e.target.value)}
          />
        </label>
        <label>
          {ru ? "Что непонятно" : "What is unclear"}
          <textarea
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button disabled={busy} type="submit">
          {ru ? "Отправить автору" : "Send to the author"}
        </button>
      </form>
      <p role="status">{status}</p>
    </details>
  );
}
