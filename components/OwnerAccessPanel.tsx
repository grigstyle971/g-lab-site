"use client";
import { OwnerStudents } from "./OwnerStudents";
import { useRef, useState, type FormEvent } from "react";
export function OwnerAccessPanel({ ru }: { ru: boolean }) {
  const formRef = useRef<HTMLDetailsElement>(null);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/course-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason, active }),
      });
      const result = await response.json();
      const errors: Record<string, string> = ru
        ? {
            forbidden: "Управлять доступом может только владелец.",
            signin: "Войдите в свой аккаунт заново.",
            invalid: "Проверьте почту и укажите причину.",
            student: "Ученик не найден или ещё не подтвердил почту.",
            setup:
              "Панель ещё не подключена к базе. Выполните настройку панели владельца в Supabase.",
          }
        : {
            forbidden: "Only the owner can manage access.",
            signin: "Please sign in again.",
            invalid: "Check the email and enter a reason.",
            student:
              "The student was not found or has not confirmed their email.",
            setup:
              "Install the owner access panel migration in Supabase first.",
          };
      if (!response.ok) {
        setMessage(
          errors[result.error] ||
            (ru
              ? "Не удалось сохранить. Попробуйте ещё раз."
              : "Could not save. Please retry."),
        );
        return;
      }
      window.dispatchEvent(new Event("g-lab-access-changed"));
      setMessage(
        active
          ? result.registrationPending
            ? ru
              ? `Ручной доступ подготовлен для ${email.trim()}. Передайте ученику ссылку ${window.location.origin}/ru/login?mode=signup — регистрация откроется только для этой почты.`
              : `Manual access is reserved for ${email.trim()}. Share ${window.location.origin}/login?mode=signup; registration will open only for this email.`
            : ru
              ? `Доступ выдан: ${email.trim()}. Ученик может обновить кабинет.`
              : `Access granted to ${email.trim()}. The student can refresh their account.`
          : result.active
            ? ru
              ? "Ручной доступ отозван. Оплаченный доступ сохранён."
              : "Manual access revoked. Paid access remains."
            : ru
              ? "Ручной доступ отозван. Курс закрыт."
              : "Manual access revoked. The course is now locked.",
      );
    } catch {
      setMessage(
        ru
          ? "Нет связи с сервером. Повторите попытку."
          : "Could not reach the server. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <details ref={formRef} className="account-panel dashboard-access-form">
        <summary>{ru ? "Выдать или изменить доступ к курсу" : "Grant or change course access"}</summary>
      <section id="owner-access-form" className="owner-access-panel">
        <p className="account-eyebrow">
          {ru ? "ТОЛЬКО ДЛЯ ВЛАДЕЛЬЦА" : "OWNER ONLY"}
        </p>
        <h2>{ru ? "Выдать доступ к курсу" : "Manage course access"}</h2>
        <p>
          {ru
            ? "Выдача существующему ученику откроет курс сразу. Если аккаунта ещё нет, доступ будет закреплён за этой почтой и разрешит регистрацию только для неё. Письмо автоматически не отправляется."
            : "An existing student gets access immediately. If no account exists, access is reserved for this email and allows registration only for it. No email is sent automatically."}
        </p>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <label>
              {ru ? "Почта ученика" : "Student email"}
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              {ru ? "Действие" : "Action"}
              <select
                value={active ? "grant" : "revoke"}
                onChange={(e) => setActive(e.target.value === "grant")}
              >
                <option value="grant">
                  {ru ? "Выдать доступ" : "Grant access"}
                </option>
                <option value="revoke">
                  {ru ? "Отозвать ручной доступ" : "Revoke manual access"}
                </option>
              </select>
            </label>
            <label>
              {ru
                ? "Причина — останется в журнале"
                : "Reason — saved in the audit log"}
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  ru ? "Например: подарок ученику" : "For example: student gift"
                }
              />
            </label>
            <button className="account-primary" type="submit">
              {busy
                ? ru
                  ? "Сохраняем…"
                  : "Saving…"
                : active
                  ? ru
                    ? "Выдать доступ"
                    : "Grant access"
                  : ru
                    ? "Отозвать ручной доступ"
                    : "Revoke manual access"}
            </button>
          </fieldset>
        </form>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </section>
      </details>
      <OwnerStudents
        ru={ru}
        onSelect={(email, active) => {
          setEmail(email);
          setActive(active);
          setReason("");
          setMessage("");
          if (formRef.current) formRef.current.open = true;
          document
            .getElementById("owner-access-form")
            ?.scrollIntoView({ behavior: "smooth" });
          document
            .querySelector<HTMLInputElement>(
              "#owner-access-form input[type=email]",
            )
            ?.focus({ preventScroll: true });
        }}
      />
    </>
  );
}
