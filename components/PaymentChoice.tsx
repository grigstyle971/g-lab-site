"use client";
import { useState } from "react";
import { useLocale } from "./LanguageProvider";
import { PRICES, type PaymentProvider } from "../lib/account/config";

export function PaymentChoice({
  available,
}: {
  available: Record<PaymentProvider, boolean>;
}) {
  const locale = useLocale();
  const ru = locale === "ru";
  const providers = (Object.keys(available) as PaymentProvider[]).filter(
    (provider) => available[provider],
  );
  const [busy, setBusy] = useState<PaymentProvider | null>(null);
  const [message, setMessage] = useState("");

  async function pay(provider: PaymentProvider) {
    setBusy(provider);
    setMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, locale }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") throw new Error();
      window.location.assign(data.url);
    } catch {
      setMessage(
        ru
          ? "Не удалось открыть оплату. Повторите позже; если деньги уже списаны, проверьте кабинет или свяжитесь с нами."
          : "Could not open checkout. Try again later; if you were already charged, check your account or contact us.",
      );
      setBusy(null);
    }
  }

  return (
    <section className="payment-choice">
      <h2>{ru ? "Как вам удобнее оплатить?" : "How would you like to pay?"}</h2>
      <p>
        {providers.length === 1
          ? ru
            ? "Сейчас доступен один способ оплаты."
            : "One payment method is currently available."
          : ru
            ? "Один курс, несколько способов оплаты. Выберите сервис."
            : "One course, several payment options. Choose a provider."}
      </p>
      <div className="payment-options">
        {providers.map((provider) => (
          <button
            key={provider}
            disabled={!!busy}
            onClick={() => pay(provider)}
          >
            <span>
              {provider === "gumroad"
                ? "Gumroad"
                : provider === "stripe"
                  ? "Stripe"
                  : "Prodamus"}
            </span>
            <strong>{PRICES[provider].label}</strong>
            <small>
              {busy === provider
                ? ru
                  ? "Открываем оплату…"
                  : "Opening checkout…"
                : provider === "gumroad"
                  ? ru
                    ? "Оплатить через Gumroad →"
                    : "Continue with Gumroad →"
                  : ru
                    ? "Перейти к оплате →"
                    : "Continue to payment →"}
            </small>
          </button>
        ))}
      </div>
      <p className="account-note">
        {available.gumroad
          ? ru
            ? "Оплатите в Gumroad и укажите почту для чека. После покупки создайте кабинет G-lab с той же почтой, задайте пароль и введите код из письма. Доступ откроется после подтверждения заказа."
            : "Pay through Gumroad using the email for your receipt. After checkout, create your G-lab account with that same email, choose a password and enter the code we email you. Access opens when the order is verified."
          : ru
            ? "После подтверждения платежа все 16 уроков появятся в вашем кабинете."
            : "All 16 lessons will be available in your account once payment is confirmed."}
      </p>
      <p role="status">{message}</p>
    </section>
  );
}
