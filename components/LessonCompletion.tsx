"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Localize, useLocale } from "./LanguageProvider";
import { restorePracticeChecks } from "../lib/lesson-progress";

const completedKey = "g-lab-course-completed";

export function LessonCompletion({ slug, checks, checkKeys, nextSlug }: {
  slug: string; checks: string[]; checkKeys: string[]; nextSlug?: string;
}) {
  const ru = useLocale() === "ru";
  const storageKey = `g-lab-concise-checks-${slug}-v1`;
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    function loadCompleted() {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(completedKey) || "[]");
        setComplete(Array.isArray(saved) && saved.includes(slug));
      } catch { setStorageError(true); }
    }
    try {
      setConfirmed(restorePracticeChecks(JSON.parse(localStorage.getItem(storageKey) || "[]"), checkKeys));
    } catch { setStorageError(true); }
    loadCompleted();
    setReady(true);
    window.addEventListener("g-lab-progress-updated", loadCompleted);
    return () => window.removeEventListener("g-lab-progress-updated", loadCompleted);
  }, [slug, storageKey, checkKeys]);

  const passed = checkKeys.every(key => confirmed.includes(key));
  function updateCheck(key: string, selected: boolean) {
    const next = selected ? [...new Set([...confirmed, key])] : confirmed.filter(value => value !== key);
    setConfirmed(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  function finish() {
    if (!ready || !passed) return;
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(completedKey) || "[]");
      const valid = Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : [];
      localStorage.setItem(completedKey, JSON.stringify([...new Set([...valid, slug])]));
      setComplete(true);
      setStorageError(false);
      window.dispatchEvent(new Event("g-lab-progress-updated"));
    } catch { setStorageError(true); }
  }

  return <Localize><section className="fl-compact-completion" id="evidence">
    <span className="fl-chapter-anchor" id="knowledge-check" />
    <h2>{ru ? "Проверьте результат" : "Check your result"}</h2>
    {complete ? <p role="status">{ru ? "Урок уже отмечен как пройденный." : "This lesson is marked complete."}</p> : <>
      <fieldset disabled={!ready} id="project-checks">
        <legend>{ru ? "Отметьте выполненное в своём проекте." : "Confirm what you have done in your project."}</legend>
        {checks.map((check, index) => <label key={checkKeys[index]}><input type="checkbox" checked={confirmed.includes(checkKeys[index])} onChange={event => updateCheck(checkKeys[index], event.target.checked)} /><span>{check}</span></label>)}
      </fieldset>
      <button type="button" className="fl-primary" disabled={!ready || !passed} onClick={finish}>{ru ? "Завершить урок" : "Complete lesson"}</button>
    </>}
    {complete && <Link className="fl-primary" href={nextSlug ? `/learn/${nextSlug}` : "/learn"}>{nextSlug ? (ru ? "Следующий урок →" : "Next lesson →") : (ru ? "Вернуться ко всем урокам" : "Back to all lessons")}</Link>}
    {storageError && <p className="fl-note" role="status">{ru ? "Не удалось сохранить прогресс в браузере. Проверьте разрешение на хранение данных и попробуйте ещё раз." : "Progress could not be saved in this browser. Check that site storage is allowed and try again."}</p>}
  </section></Localize>;
}
