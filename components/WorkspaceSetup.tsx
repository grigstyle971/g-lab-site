"use client";
import { useState } from "react";
export function WorkspaceSetup({ ru }: { ru: boolean }) {
  const [status, setStatus] = useState(""),
    [sql, setSql] = useState("");
  async function copy() {
    try {
      const r = await fetch("/api/account/workspace-setup");
      if (!r.ok) throw new Error();
      const text = await r.text();
      setSql(text);
      try {
        await navigator.clipboard.writeText(text);
        setStatus(
          ru
            ? "Скопировано. Вставьте в SQL Editor и нажмите Run."
            : "Copied. Paste into SQL Editor and press Run.",
        );
      } catch {
        setStatus(
          ru
            ? "Выделите и скопируйте запрос из поля ниже."
            : "Select and copy the query below.",
        );
      }
    } catch {
      setStatus(
        ru
          ? "Не удалось загрузить запрос. Войдите как владелец."
          : "Could not load the query. Sign in as the owner.",
      );
    }
  }
  return (
    <details className="account-panel">
      <summary>
        {ru
          ? "Подключить новые функции — один раз"
          : "Connect the new features — once"}
      </summary>
      <p>
        {ru
          ? "Если список учеников, сообщения или сохранение ещё недоступны: скопируйте запрос, выполните его один раз в Supabase и обновите кабинет. Повторно запускать уже выполненный запрос не нужно."
          : "If students, feedback or account storage are unavailable, copy this query, run it once in Supabase and refresh your account. Do not rerun a completed setup."}
      </p>
      <button type="button" onClick={copy}>
        {ru ? "Скопировать установочный запрос" : "Copy setup query"}
      </button>
      <p>
        <a
          href="https://supabase.com/dashboard/project/bumhepivlebbpvlaxqwh/sql/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          {ru ? "Открыть SQL Editor →" : "Open SQL Editor →"}
        </a>
      </p>
      <p role="status">{status}</p>
      {sql && (
        <textarea
          aria-label={ru ? "Установочный запрос" : "Setup query"}
          readOnly
          value={sql}
          rows={8}
          style={{ width: "100%" }}
        />
      )}
    </details>
  );
}
