"use client";
import { useEffect, useState } from "react";
import { useLocale } from "./LanguageProvider";
export function ProgressSync() {
  const ru = useLocale() === "ru",
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let stopped = false,
      known = new Set<string>(),
      ready = false;
    let loading = false,
      syncing = false,
      syncAgain = false,
      retryDelay = 3_000,
      retryTimer: number | undefined;

    function clearRetry() {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      retryTimer = undefined;
    }

    function recover() {
      retryDelay = 3_000;
      clearRetry();
    }

    function scheduleRetry() {
      if (stopped || retryTimer !== undefined) return;
      const delay = retryDelay;
      retryDelay = Math.min(retryDelay * 2, 30_000);
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        if (ready) void sync();
        else void load();
      }, delay);
    }

    async function sync() {
      if (!ready || stopped) return;
      if (syncing) {
        syncAgain = true;
        return;
      }
      syncing = true;
      let syncFailed = false;
      let unauthorized = false;
      try {
        const slugs: unknown = JSON.parse(
          localStorage.getItem("g-lab-course-completed") || "[]",
        );
        if (Array.isArray(slugs)) {
          for (const slug of slugs) {
            if (typeof slug !== "string" || known.has(slug)) continue;
            try {
              const r = await fetch("/api/account/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
              });
              if (r.status === 401) unauthorized = true;
              if (!r.ok) throw new Error();
              known.add(slug);
            } catch {
              syncFailed = true;
            }
          }
        }
      } catch {
        syncFailed = true;
      } finally {
        syncing = false;
        if (!stopped) {
          if (unauthorized) ready = false;
          if (syncFailed) {
            setFailed(true);
            scheduleRetry();
          } else {
            setFailed(false);
            recover();
          }
          if (syncAgain && !syncFailed) {
            syncAgain = false;
            void sync();
          } else {
            syncAgain = false;
          }
        }
      }
    }

    async function load() {
      if (stopped || loading) return;
      loading = true;
      try {
        const r = await fetch("/api/account/progress", { cache: "no-store" });
        if (r.status === 401) {
          localStorage.removeItem("g-lab-progress-owner");
          setFailed(false);
          recover();
          return;
        }
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (stopped) return;
        if (typeof data.userId !== "string" || !Array.isArray(data.completed))
          throw new Error();
        const completed = data.completed.filter(
          (slug: unknown): slug is string => typeof slug === "string",
        );
        known = new Set(completed);
        const same =
          localStorage.getItem("g-lab-progress-owner") === data.userId;
        let local: unknown = [];
        try {
          local = JSON.parse(
            localStorage.getItem("g-lab-course-completed") || "[]",
          );
        } catch {}
        const merged = [
          ...new Set([
            ...completed,
            ...(same && Array.isArray(local)
              ? local.filter((x) => typeof x === "string")
              : []),
          ]),
        ];
        localStorage.setItem("g-lab-progress-owner", data.userId);
        localStorage.setItem("g-lab-course-completed", JSON.stringify(merged));
        ready = true;
        setFailed(false);
        recover();
        window.dispatchEvent(new Event("g-lab-progress-updated"));
      } catch {
        if (!stopped) {
          setFailed(true);
          scheduleRetry();
        }
      } finally {
        loading = false;
      }
    }

    void load();
    const retry = () => {
      recover();
      if (ready) void sync();
      else void load();
    };
    window.addEventListener("g-lab-progress-updated", retry);
    window.addEventListener("online", retry);
    return () => {
      stopped = true;
      clearRetry();
      window.removeEventListener("g-lab-progress-updated", retry);
      window.removeEventListener("online", retry);
    };
  }, []);
  return failed ? (
    <p className="account-sync-note" role="status">
      {ru
        ? "Не удалось синхронизировать прогресс. Результат сохранён в этом браузере; попробуем ещё раз автоматически."
        : "Progress could not sync. Your result is saved in this browser; we will retry automatically."}
    </p>
  ) : null;
}
