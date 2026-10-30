"use client";
import { useState } from "react";
import { useLocale } from "./LanguageProvider";
import { PurchaseAccessHelp } from "./PurchaseAccessHelp";
export function PaymentStatus() {
  const ru = useLocale() === "ru",
    [busy, setBusy] = useState(false);
  return (
    <section className="account-notice" role="status">
      <strong>
        {ru
          ? "Ожидаем подтверждение оплаты"
          : "Waiting for payment confirmation"}
      </strong>
      <PurchaseAccessHelp ru={ru} />
      <button
        disabled={busy}
        onClick={() => {
          setBusy(true);
          window.location.reload();
        }}
      >
        {ru ? "Проверить оплату" : "Check payment"}
      </button>
    </section>
  );
}
