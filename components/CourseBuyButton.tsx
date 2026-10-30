"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./LanguageProvider";
import { ArrowIcon } from "./ArrowIcon";
import { marketingEvent } from "../lib/marketing-events";

export function CourseBuyButton({ available, compact = false }: { available: boolean; compact?: boolean }) {
  const ru = useLocale() === "ru",
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    attemptRef = useRef(0),
    recoveryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const restoreButton = () => {
      attemptRef.current += 1;
      if (recoveryTimerRef.current !== null) {
        window.clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      setBusy(false);
      setMessage("");
    };
    const restoreVisibleButton = () => {
      if (document.visibilityState === "visible") restoreButton();
    };

    window.addEventListener("pageshow", restoreButton);
    window.addEventListener("focus", restoreButton);
    document.addEventListener("visibilitychange", restoreVisibleButton);
    return () => {
      window.removeEventListener("pageshow", restoreButton);
      window.removeEventListener("focus", restoreButton);
      document.removeEventListener("visibilitychange", restoreVisibleButton);
      if (recoveryTimerRef.current !== null) window.clearTimeout(recoveryTimerRef.current);
    };
  }, []);

  async function buy() {
    if (busy || !available) return;
    marketingEvent("checkout_started", "gumroad");
    const attempt = ++attemptRef.current;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gumroad", locale: ru ? "ru" : "en" }),
      });
      const data = await response.json();
      if (attempt !== attemptRef.current) return;
      if (!response.ok || typeof data.url !== "string") throw new Error();
      marketingEvent("checkout_opened", "gumroad");
      window.location.assign(data.url);
      recoveryTimerRef.current = window.setTimeout(() => {
        if (attempt !== attemptRef.current || document.visibilityState !== "visible") return;
        attemptRef.current += 1;
        recoveryTimerRef.current = null;
        setBusy(false);
        setMessage(
          ru
            ? "Gumroad не открылся. Оплата не начиналась — попробуйте ещё раз."
            : "Gumroad did not open. Checkout did not start — please try again.",
        );
      }, 12000);
    } catch {
      marketingEvent("checkout_failed", "gumroad");
      if (attempt !== attemptRef.current) return;
      if (recoveryTimerRef.current !== null) {
        window.clearTimeout(recoveryTimerRef.current);
        recoveryTimerRef.current = null;
      }
      setMessage(
        ru
          ? "Оплата сейчас недоступна. Мы не списали деньги. Попробуйте позже."
          : "Checkout is temporarily unavailable. No payment was taken. Please try again shortly.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="course-sales-buy">
      <button type="button" onClick={buy} disabled={!available || busy}>
        {busy
          ? ru
            ? "Открываем Gumroad…"
            : "Opening Gumroad…"
          : compact
            ? ru ? "Купить курс" : "Buy the course"
            : ru
              ? "Купить курс"
              : "Buy the course"}
        <span aria-hidden="true"><ArrowIcon /></span>
      </button>
      <p role="status" aria-live="polite">
        {message || (!available
          ? ru
            ? "Оплата временно не подключена."
            : "Secure checkout is being connected."
          : "")}
      </p>
    </div>
  );
}
