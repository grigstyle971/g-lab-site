import Link from "next/link";
import { AccountLayout } from "../../components/AccountLayout";
import { PaymentChoice } from "../../components/PaymentChoice";
import { currentAccount, hasCourseAccess } from "../../lib/account/server";
import { paymentConfigured } from "../../lib/account/config";

export default async function CheckoutPage({
  locale = "en",
}: {
  locale?: "en" | "ru";
}) {
  const ru = locale === "ru",
    prefix = ru ? "/ru" : "",
    { user } = await currentAccount(),
    access = user ? await hasCourseAccess() : false,
    available = {
      gumroad: paymentConfigured("gumroad"),
      stripe: false,
      prodamus: false,
    },
    hasPaymentOption = Object.values(available).some(Boolean);

  return (
    <AccountLayout locale={locale}>
      <div className="account-layout">
        <section className="account-intro">
          <p className="account-eyebrow">G-LAB / {ru ? "КУРС" : "THE COURSE"}</p>
          <h1>
            {ru ? "Создайте сайт и запустите его." : "Build your website. Launch it."}
          </h1>
          <p>
            {ru
              ? "16 практических уроков: от идеи и первой страницы до публикации и личного кабинета."
              : "16 practical lessons, from your idea and first page to publishing and a private client area."}
          </p>
          <ul>
            <li>{ru ? "Разовая покупка · $19 USD" : "One-time purchase · $19 USD"}</li>
            <li>{ru ? "Курс использует Codex в настольном приложении ChatGPT и локальную папку проекта. Нужен компьютер; шаги написаны для Windows и Mac, на Linux могут отличаться" : "The course uses Codex in the ChatGPT desktop app with a local project folder. A computer is required; steps cover Windows and Mac and may differ on Linux."}</li>
            <li>{ru ? "Доступ ко всем 16 урокам после подтверждения заказа" : "Access to all 16 lessons after your order is verified"}</li>
            <li>{ru ? "После оплаты используйте ту же почту, что в чеке: создайте аккаунт по коду или войдите" : "After checkout, use the receipt email to create an account with a code or sign in"}</li>
            <li>{ru ? "Налог может добавиться по правилам вашей страны" : "Tax may be added based on your country"}</li>
            <li>{ru ? "Codex включён в тарифы ChatGPT в поддерживаемых регионах; лимиты зависят от плана и задачи. Для других сервисов могут понадобиться отдельные аккаунты или платные тарифы" : "Codex is included with ChatGPT plans where available; usage limits vary. Other services may require separate accounts or paid plans."}</li>
          </ul>
          <p className="account-note">
            <Link href={`${prefix}/terms`}>{ru ? "Условия курса" : "Course terms"}</Link>
            {" · "}
            <Link href={`${prefix}/privacy`}>{ru ? "Данные и конфиденциальность" : "Privacy notice"}</Link>
          </p>
        </section>

        {access ? (
          <section className="account-panel">
            <h2>{ru ? "У вас уже есть доступ" : "You already have access"}</h2>
            <Link className="account-primary" href={`${prefix}/account`}>
              {ru ? "Открыть личный кабинет →" : "Open your account →"}
            </Link>
          </section>
        ) : hasPaymentOption ? (
          <PaymentChoice available={available} />
        ) : (
          <section className="account-panel">
            <h2>{ru ? "Оплата временно недоступна" : "Checkout is temporarily unavailable"}</h2>
            <p>
              {ru
                ? "Сейчас мы подключаем безопасное подтверждение оплаты и автоматическую выдачу доступа. Деньги не списываются, пока вы не перейдёте на защищённую страницу оплаты."
                : "We are finishing secure payment verification and automatic course access. You will not be charged until you reach the secure checkout page."}
            </p>
            <a href="mailto:glab.tech.support@gmail.com">
              {ru ? "Написать в поддержку" : "Contact support"}
            </a>
          </section>
        )}
      </div>
    </AccountLayout>
  );
}
