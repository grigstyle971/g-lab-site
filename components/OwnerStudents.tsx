"use client";
import { useEffect, useState, type FormEvent } from "react";
type Student = {
  id: string;
  email: string;
  confirmed: boolean;
  active: boolean;
  manual_access: boolean;
  paid_access: boolean;
  completed: number;
  pending_registration?: boolean;
  access_since: string | null;
  manual_updated_at: string | null;
  reason: string | null;
};
type Feedback = {
  id: string;
  email: string;
  lesson_slug: string;
  step: string;
  message: string;
  created_at: string;
  resolved: boolean;
};
export function OwnerStudents({
  ru,
  onSelect,
}: {
  ru: boolean;
  onSelect: (email: string, active: boolean) => void;
}) {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [items, setItems] = useState<Student[]>([]),
    [more, setMore] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [copiedInvite, setCopiedInvite] = useState("");
  async function load(term: string, after?: string) {
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch(
        "/api/account/students?search=" +
          encodeURIComponent(term) +
          (after ? "&after=" + after : ""),
      );
      const b = await r.json();
      if (!r.ok) {
        setItems([]);
        setMore(false);
        setStatus(
          ru
            ? "Список пока недоступен. Проверьте подключение обновления в Supabase."
            : "The list is unavailable. Check the Supabase workspace migration.",
        );
        return;
      }
      setItems((old) => (after ? [...old, ...b.items] : b.items));
      setMore(b.more);
      setQuery(term);
    } catch {
      setStatus(
        ru ? "Не удалось загрузить учеников." : "Could not load students.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load("");
    const listener = () => load("");
    window.addEventListener("g-lab-access-changed", listener);
    return () => window.removeEventListener("g-lab-access-changed", listener);
  }, []);
  return (
    <section className="account-panel owner-students">
      <h2>{ru ? "Ученики" : "Students"}</h2>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          load(search);
        }}
      >
        <label>
          {ru ? "Поиск по почте" : "Search by email"}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={254}
          />
        </label>
        <button disabled={busy} type="submit">
          {ru ? "Найти" : "Search"}
        </button>
      </form>
      <p role="status">{status}</p>
      {!busy && !status && !items.length && (
        <p>
          {ru
            ? "По этому запросу учеников нет."
            : "No students match this search."}
        </p>
      )}
      <ul className="student-list">
        {items.map((s) => (
          <li key={s.id}>
            <h3>{s.email}</h3>
            <p>
              {s.pending_registration
                ? ru
                  ? "Ручной доступ подготовлен · аккаунт ещё не создан"
                  : "Manual access reserved · account not created yet"
                : !s.confirmed
                ? ru
                  ? "Почта не подтверждена"
                  : "Email unconfirmed"
                : s.active
                  ? ru
                    ? "Курс открыт"
                    : "Course available"
                  : ru
                    ? "Курс закрыт"
                    : "Course locked"}{" "}
              · {s.completed}/16
            </p>
            <p>
              {s.paid_access
                ? ru
                  ? "Оплата подтверждена"
                  : "Paid access"
                : ""}
              {s.paid_access && s.manual_access ? " + " : ""}
              {s.manual_access ? (ru ? "Ручной доступ" : "Manual access") : ""}
              {!s.paid_access && !s.manual_access
                ? ru
                  ? "Нет действующей покупки или ручной выдачи"
                  : "No current purchase or manual grant"
                : ""}
            </p>
            {s.access_since && (
              <small>
                {ru ? "Первая выдача: " : "First access: "}
                {new Date(s.access_since).toLocaleDateString(
                  ru ? "ru-RU" : "en-GB",
                )}
              </small>
            )}
            {s.manual_updated_at && (
              <p>
                <small>
                  {ru ? "Ручной доступ обновлён: " : "Manual access updated: "}
                  {new Date(s.manual_updated_at).toLocaleDateString(
                    ru ? "ru-RU" : "en-GB",
                  )}{" "}
                  · {s.reason}
                </small>
              </p>
            )}
            {s.pending_registration && (
              <div className="workbook-actions">
                <button
                  type="button"
                  onClick={async () => {
                    const signupPath = `${ru ? "/ru" : ""}/login?mode=signup`;
                    try {
                      await navigator.clipboard.writeText(
                        new URL(signupPath, window.location.origin).toString(),
                      );
                      setCopiedInvite(s.email);
                    } catch {
                      setCopiedInvite(`failed:${s.email}`);
                    }
                  }}
                >
                  {copiedInvite === s.email
                    ? ru
                      ? "Ссылка скопирована"
                      : "Signup link copied"
                    : ru
                      ? "Скопировать ссылку для ученика"
                      : "Copy signup link for student"}
                </button>
                {copiedInvite === `failed:${s.email}` && (
                  <small role="status">
                    {ru
                      ? "Не удалось скопировать. Откройте и скопируйте ссылку: "
                      : "Could not copy. Open and copy this link: "}
                    <a
                      href={`${ru ? "/ru" : ""}/login?mode=signup`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ru ? "Регистрация ученика" : "Student signup"}
                    </a>
                  </small>
                )}
              </div>
            )}
            <div className="workbook-actions">
              <button
                type="button"
                disabled={!s.confirmed || s.pending_registration}
                onClick={() => onSelect(s.email, true)}
              >
                {ru ? "Выдать доступ" : "Grant access"}
              </button>
              {s.manual_access && (
                <button type="button" onClick={() => onSelect(s.email, false)}>
                  {ru ? "Отозвать ручной доступ" : "Revoke manual access"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {more && (
        <button
          type="button"
          disabled={busy}
          onClick={() => load(query, items.at(-1)?.id)}
        >
          {ru ? "Показать ещё" : "Show more"}
        </button>
      )}
    </section>
  );
}
export function OwnerFeedback({ ru }: { ru: boolean }) {
  const [items, setItems] = useState<Feedback[]>([]),
    [status, setStatus] = useState(""),
    [resolved, setResolved] = useState(false),
    [busy, setBusy] = useState(false);
  async function load(done: boolean) {
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/account/feedback?resolved=" + done);
      const b = await r.json();
      if (!r.ok) {
        setItems([]);
        setStatus(
          ru
            ? "Сообщения пока недоступны. Проверьте настройку в Supabase."
            : "Messages are unavailable. Check the Supabase setup.",
        );
        return;
      }
      setItems(b.items);
      setResolved(done);
    } catch {
      setStatus(
        ru ? "Не удалось загрузить сообщения." : "Could not load messages.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load(false);
  }, []);
  async function resolve(id: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/account/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", id, resolved: !resolved }),
      });
      if (!r.ok) throw new Error();
      await load(resolved);
    } catch {
      setStatus(
        ru ? "Не удалось изменить статус." : "Could not update the status.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-panel">
      <h2>{ru ? "Где ученикам непонятно" : "Where students get stuck"}</h2>
      <p>
        {ru
          ? "Последние 50 сообщений в выбранном разделе."
          : "The latest 50 messages in the selected view."}
      </p>
      <div className="workbook-actions">
        <button
          type="button"
          disabled={busy}
          aria-pressed={!resolved}
          onClick={() => load(false)}
        >
          {ru ? "Новые" : "Open"}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-pressed={resolved}
          onClick={() => load(true)}
        >
          {ru ? "Разобрано" : "Resolved"}
        </button>
      </div>
      <p role="status">{status}</p>
      {!busy && !status && !items.length && (
        <p>{ru ? "Сообщений пока нет." : "No messages yet."}</p>
      )}
      <ul className="student-list">
        {items.map((f) => (
          <li key={f.id}>
            <h3>{f.email}</h3>
            <a
              href={
                (ru ? "/ru" : "") +
                "/learn/" +
                encodeURIComponent(f.lesson_slug)
              }
            >
              {f.lesson_slug} →
            </a>
            <p>
              <strong>{f.step}</strong>
            </p>
            <p className="feedback-message">{f.message}</p>
            <small>
              {new Date(f.created_at).toLocaleString(ru ? "ru-RU" : "en-GB")}
            </small>
            <div>
              <button
                disabled={busy}
                type="button"
                onClick={() => resolve(f.id)}
              >
                {resolved
                  ? ru
                    ? "Вернуть в новые"
                    : "Reopen"
                  : ru
                    ? "Отметить разобранным"
                    : "Mark resolved"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
