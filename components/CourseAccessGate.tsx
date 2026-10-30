import Link from "next/link";
import { AccountLayout } from "./AccountLayout";
export function CourseAccessGate({
  locale = "en",
  title,
}: {
  locale?: "en" | "ru";
  title: string;
}) {
  const ru = locale === "ru",
    prefix = ru ? "/ru" : "";
  return (
    <AccountLayout locale={locale}>
      <div className="account-layout">
        <section className="account-intro">
          <p className="account-eyebrow">
            {ru ? "УРОК КУРСА" : "COURSE LESSON"}
          </p>
          <h1>{title}</h1>
          <p>
            {ru
              ? "Этот урок входит в полный курс. Войдите в аккаунт с почтой, указанной при покупке. Если вы ещё не создали аккаунт, сделайте это после оплаты."
              : "This lesson is part of the full course. Sign in with the email you used at checkout. If you have not created an account yet, do that after paying."}
          </p>
        </section>
        <section className="account-panel">
          <h2>
            {ru ? "Продолжим в вашем кабинете" : "Continue in your account"}
          </h2>
          <Link className="account-primary" href={`${prefix}/login`}>
            {ru ? "Войти →" : "Sign in →"}
          </Link>
          <Link
            className="account-secondary"
            href={`${prefix}/course-checkout`}
          >
            {ru ? "Получить доступ к курсу" : "Get course access"}
          </Link>
        </section>
      </div>
    </AccountLayout>
  );
}
