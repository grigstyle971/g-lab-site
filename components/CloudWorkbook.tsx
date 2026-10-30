"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "./LanguageProvider";
import { validNotebook } from "../lib/account/notebook";
import { lessons } from "../lib/course";
import { translate } from "../lib/i18n/translate";
import { projectNoteOutline } from "../lib/project-note-prompts";
import { makeWorkbookBackup, readWorkbookBackup, maxWorkbookFileBytes, snapshotFingerprint, type WorkbookSnapshot, type WorkbookContent as Content } from "../lib/workbook-backup";
export type { WorkbookSnapshot } from "../lib/workbook-backup";
export function CloudWorkbook({
  slug,
  snapshot,
  onRestore,
  checks = [],
}: {
  slug: string;
  snapshot: WorkbookSnapshot;
  onRestore: (value: WorkbookSnapshot) => void;
  checks?: readonly string[];
}) {
  const locale = useLocale();
  const translations = useTranslations();
  const ru = locale === "ru";
  const fileReadId = useRef(0);
  const [pendingBackup, setPendingBackup] = useState<Content | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [notes, setNotes] = useState(""),
    [url, setUrl] = useState(""),
    [revision, setRevision] = useState<number | null>(null),
    [userId, setUserId] = useState(""),
    [saved, setSaved] = useState<Content | null>(null),
    [busy, setBusy] = useState(true),
    [status, setStatus] = useState(""),
    [dirty, setDirty] = useState(false);
  const snapshotChanged = saved !== null && snapshotFingerprint(snapshot) !== snapshotFingerprint(saved);
  const answersWithoutAccountCopy = saved === null && (Object.keys(snapshot.answers).length > 0 || Boolean(snapshot.practiceChecks?.length) || snapshot.activities?.choice != null);
  const unsaved = dirty || snapshotChanged || answersWithoutAccountCopy;
  const title = translate(lessons.find(item => item.slug === slug)?.title || slug, locale, translations);
  useEffect(() => () => { fileReadId.current += 1; }, []);
  const errorText = (code: string) =>
    ru
      ? {
          signin:
            "Войдите в аккаунт, чтобы сохранить работу между устройствами.",
          setup:
            "Сохранение в аккаунте пока недоступно. Скачайте копию работы.",
          access: "Для этого урока нужен доступ к курсу.",
          invalid: "Проверьте ссылку (http или https) и длину текста.",
          conflict:
            "Есть более новая версия. Скачайте свою копию, затем загрузите сохранённую версию перед следующей записью.",
          account: "Аккаунт изменился. Скачайте копию и обновите страницу.",
        }[code] || "Не удалось сохранить. Текст остался на странице."
      : {
          signin: "Sign in to save your work across devices.",
          setup:
            "Account storage is unavailable. Download a copy of your work.",
          access: "You need course access for this lesson.",
          invalid: "Check the URL (http or https) and text length.",
          conflict:
            "A newer version exists. Download your copy, then load the saved version before saving again.",
          account:
            "Your account changed. Download a copy and reload this page.",
        }[code] || "Could not save. Your text is still on this page.";
  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/notebook?slug=" + encodeURIComponent(slug))
      .then(async (r) => {
        const b = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setStatus(errorText(b.error));
          return;
        }
        setUserId(b.userId);
        const content = b.notebook?.content;
        if (content && !validNotebook(content)) {
          setStatus(errorText("setup"));
          return;
        }
        setRevision(b.notebook?.revision || 0);
        if (content) {
          setSaved(content);
          setNotes(content.notes);
          setUrl(content.url);
          setStatus(
            ru
              ? "Заметки загружены. Нажмите «Восстановить ответы», чтобы заменить ответы на странице сохранёнными."
              : "Notes loaded. Use Restore answers to replace the answers on this page with your saved answers.",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setStatus(errorText("setup"));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  async function save() {
    setBusy(true);
    try {
      const content = { ...snapshot, notes, url };
      const r = await fetch("/api/account/notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content, revision, userId }),
      });
      const b = await r.json();
      if (!r.ok) {
        setStatus(errorText(b.error));
        return;
      }
      setRevision(b.revision);
      setSaved(content);
      setDirty(false);
      setImportStatus("");
      setStatus(
        ru
          ? "Работа сохранена в вашем аккаунте."
          : "Your work is saved in your account.",
      );
    } catch {
      setStatus(errorText("setup"));
    } finally {
      setBusy(false);
    }
  }
  async function load() {
    setBusy(true);
    try {
      const r = await fetch(
        "/api/account/notebook?slug=" + encodeURIComponent(slug),
      );
      const b = await r.json();
      if (!r.ok) {
        setStatus(errorText(b.error));
        return;
      }
      if (userId && b.userId !== userId) {
        setStatus(errorText("account"));
        return;
      }
      const content = b.notebook?.content;
      if (content && !validNotebook(content)) {
        setStatus(errorText("setup"));
        return;
      }
      setUserId(b.userId);
      setRevision(b.notebook?.revision || 0);
      if (content) {
        setSaved(content);
        setNotes(content.notes);
        setUrl(content.url);
        onRestore(content);
        setDirty(false);
        setStatus(
          ru ? "Сохранённая работа восстановлена." : "Saved work restored.",
        );
      } else
        setStatus(
          ru
            ? "В аккаунте пока нет записи для этого урока."
            : "No saved work for this lesson yet.",
        );
    } catch {
      setStatus(errorText("setup"));
    } finally {
      setBusy(false);
    }
  }
  function download() {
    downloadFile(makeWorkbookBackup(slug, { ...snapshot, notes, url }), "json", "application/json");
  }
  function downloadFile(text: string, extension: string, type: string) {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "g-lab-" + slug + "." + extension;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  function downloadNotes() {
    const labels: Record<string, string> = ru
      ? { business: "Название и услуга", audience: "Посетитель", outcome: "Результат для посетителя", action: "Главная кнопка" }
      : { business: "Business and service", audience: "Visitor", outcome: "Visitor outcome", action: "Main action" };
    const parts = [
      `G-lab — ${title}`,
      ru ? "Запись ученика. Отметки отражают самопроверку, а не проверку преподавателем." : "Learner's record. Confirmations are self-assessment, not a tutor's review.",
      `${ru ? "Сайт" : "Website"}: ${url || (ru ? "Не указан" : "Not recorded")}`,
      `${ru ? "Мои заметки" : "My notes"}\n${notes || (ru ? "Пока пусто" : "No notes yet")}`,
    ];
    if (snapshot.brief) parts.push(`${ru ? "Описание первого сайта" : "First website brief"}\n` + Object.entries(snapshot.brief).map(([key, value]) => `${labels[key] || key}: ${value}`).join("\n"));
    parts.push(`${ru ? "Практика на моём сайте" : "Practice on my website"}\n` + checks.map(check => `[${snapshot.practiceChecks?.includes(check) ? "x" : " "}] ${translate(check, locale, translations)}`).join("\n"));
    parts.push(ru ? "Для восстановления ответов в курсе используйте отдельную резервную копию JSON. Этот текстовый конспект можно читать и дополнять в своём проекте." : "Use the separate JSON backup to restore course answers. This text note is for reading and continuing your project.");
    downloadFile(parts.join("\n\n") + "\n", "txt", "text/plain");
  }
  async function prepareImport(file: File | undefined) {
    const request = ++fileReadId.current;
    setPendingBackup(null);
    setImportStatus("");
    if (!file) { setReadingFile(false); return; }
    setReadingFile(true);
    try {
      const result = file.size > maxWorkbookFileBytes
        ? { ok: false as const, error: "size" as const }
        : readWorkbookBackup(await file.text(), slug);
      if (request !== fileReadId.current) return;
      if (!result.ok) {
        const messages = ru ? {
          size: "Файл слишком большой. Выберите резервную копию G-lab размером до 100 КБ.",
          lesson: "Это копия другого урока. Откройте соответствующий урок и загрузите её там.",
          version: "Формат этой копии пока не поддерживается. Работа на странице не изменена.",
          invalid: "Не удалось прочитать копию. Нужен файл JSON, скачанный из урока G-lab, с допустимой структурой данных.",
        } : {
          size: "The file is too large. Choose a G-lab backup up to 100 KB.",
          lesson: "This backup belongs to another lesson. Open that lesson to restore it.",
          version: "This backup format is not supported yet. Your work on this page is unchanged.",
          invalid: "Could not read the backup. Choose a JSON file downloaded from a G-lab lesson with a valid data structure.",
        };
        setImportStatus(messages[result.error]);
        return;
      }
      setPendingBackup(result.content);
      setImportStatus(ru ? "Файл прочитан. Пока ничего не заменено." : "File read. Nothing has been replaced yet.");
    } catch {
      if (request === fileReadId.current) setImportStatus(ru ? "Не удалось открыть файл. Работа на странице не изменена." : "Could not open the file. Your work on this page is unchanged.");
    } finally {
      if (request === fileReadId.current) setReadingFile(false);
    }
  }
  function restoreFile() {
    if (!pendingBackup) return;
    setNotes(pendingBackup.notes);
    setUrl(pendingBackup.url);
    onRestore(pendingBackup);
    setDirty(true);
    setPendingBackup(null);
    setImportStatus(ru ? "Копия восстановлена на этой странице. Сохраните её в аккаунте; мини-задания и ответы викторины нужно проверить снова." : "Backup restored on this page. Save it to your account; check the mini-exercises and quiz answers again.");
  }
  return (
    <section className="cloud-workbook" aria-labelledby={"workbook-" + slug}>
      <h2 id={"workbook-" + slug}>
        {ru ? "Моя работа по уроку" : "My lesson work"}
      </h2>
      <p>
        {ru
          ? "Здесь можно сохранить отметки о выполненной практике, ответы, заметки и ссылку на проект. В первом уроке сохраняется и описание сайта. После восстановления снова проверьте ответы мини-заданий и викторины."
          : "Save your practice checklist, answers, notes and project URL here. Lesson one also saves your website brief. After restoring, check the mini-exercises and quiz answers again."}
      </p>
      <label>
        {ru
          ? "Что получилось, что проверить дальше"
          : "What worked and what to check next"}
        <textarea
          disabled={busy}
          rows={5}
          maxLength={12000}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setDirty(true);
          }}
        />
      </label>
      <button type="button" disabled={busy || Boolean(notes.trim())} onClick={() => { setNotes(projectNoteOutline(slug, locale)); setDirty(true); }}>
        {ru ? "Добавить план в пустую заметку" : "Add a plan to an empty note"}
      </button>
      <p className="fl-note">{ru ? "В каждом уроке — свои вопросы для записи результата. Заменяйте подсказки наблюдениями из своего проекта; невыполненные проверки так и отмечайте." : "Each lesson has its own questions to help record the result. Replace the prompts with observations from your project; leave unperformed checks marked as such."}</p>
      <label>
        {ru ? "Ссылка на ваш сайт" : "Your website URL"}
        <input
          disabled={busy}
          type="url"
          maxLength={1000}
          value={url}
          placeholder="https://"
          onChange={(e) => {
            setUrl(e.target.value);
            setDirty(true);
          }}
        />
      </label>
      <p>
        {ru
          ? "Не добавляйте пароли, ключи или данные клиентов. Сохранение выполняется по кнопке."
          : "Do not include passwords, keys or customer data. Use the button to save."}
      </p>
      <div className="workbook-actions">
        <button
          type="button"
          disabled={busy || revision === null}
          onClick={save}
        >
          {ru ? "Сохранить в аккаунте" : "Save to my account"}
        </button>
        {saved && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onRestore(saved);
              setStatus(
                ru
                  ? "Ответы восстановлены. Проверьте их перед завершением урока."
                  : "Answers restored. Review them before completing the lesson.",
              );
            }}
          >
            {ru ? "Восстановить ответы" : "Restore answers"}
          </button>
        )}
        <button type="button" disabled={busy} onClick={downloadNotes}>
          {ru ? "Скачать конспект TXT" : "Download notes TXT"}
        </button>
        <button type="button" disabled={busy} onClick={download}>
          {ru ? "Скачать копию JSON" : "Download backup JSON"}
        </button>
      </div>
      <details>
        <summary>
          {ru ? "Загрузить версию из аккаунта" : "Load the account version"}
        </summary>
        <p>
          {ru
            ? "Загрузка заменит заметки и ответы на этой странице. Сначала скачайте копию, если хотите сохранить текущую работу."
            : "Loading replaces notes and answers on this page. Download a copy first if you want to keep your current work."}
        </p>
        <button type="button" disabled={busy} onClick={load}>
          {ru ? "Загрузить и заменить" : "Load and replace"}
        </button>
      </details>
      <details>
        <summary>{ru ? "Восстановить из файла" : "Restore from a file"}</summary>
        <p id={`workbook-import-help-${slug}`}>{ru ? "Выберите копию JSON этого урока. Поддерживаются и ранее скачанные копии. После просмотра нажмите кнопку замены. Если текущая работа нужна, сначала скачайте её копию. Файл читается на вашем устройстве; в аккаунт работа попадёт только после сохранения." : "Choose this lesson's JSON backup. Older downloads are supported too. Review it before replacing your work. Download your current work first if you want to keep it. The file is read on your device; account storage changes only when you save."}</p>
        <label>{ru ? "Файл резервной копии JSON" : "JSON backup file"}<input type="file" accept=".json,application/json" disabled={busy} aria-describedby={`workbook-import-help-${slug}`} onChange={event => { void prepareImport(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}/></label>
        {pendingBackup && <div className="workbook-import-preview">
          <p><strong>{title}</strong></p>
          <p>{ru ? "Начало заметки: " : "Note preview: "}{pendingBackup.notes.slice(0, 240) || (ru ? "Пустая заметка" : "No notes")}</p>
          <p>{ru ? "Ссылка: " : "URL: "}{pendingBackup.url || (ru ? "Не указана" : "Not recorded")}</p>
          <button type="button" disabled={busy || readingFile} onClick={restoreFile}>{ru ? "Заменить работу на странице" : "Replace work on this page"}</button>
        </div>}
        <p role="status">{readingFile ? (ru ? "Читаю файл…" : "Reading file…") : importStatus}</p>
      </details>
      {unsaved && (
        <p>
          {ru
            ? "Есть изменения, не сохранённые в аккаунте."
            : "Some changes have not been saved to your account."}
        </p>
      )}
      <p role="status">{unsaved && status === (ru ? "Работа сохранена в вашем аккаунте." : "Your work is saved in your account.") ? "" : status}</p>
    </section>
  );
}
