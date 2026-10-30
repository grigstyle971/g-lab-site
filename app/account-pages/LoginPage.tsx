import { AccountLayout } from "../../components/AccountLayout";
import { AccountForm } from "../../components/AccountForms";
import { authConfigured, safeNext } from "../../lib/account/config";
export default async function LoginPage({
  searchParams,
  locale = "en",
  password = false,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale?: "en" | "ru";
  password?: boolean;
}) {
  const query = await searchParams,
    ru = locale === "ru";
  return (
    <AccountLayout locale={locale}>
      <div className="account-layout">
        <section className="account-intro">
          <p className="account-eyebrow">G-LAB LEARNING</p>
          <h2>
            {ru ? "Вернитесь к своему сайту." : "Pick up where you left off."}
          </h2>
          <p>
            {ru
              ? "Войдите, чтобы открыть курс, продолжить обучение и увидеть свои покупки. После оплаты создайте аккаунт с той же почтой, задайте пароль и введите код из письма."
              : "Sign in to open your course, continue learning and view your purchases. After paying, create an account with the same email, choose a password and enter the code we send."}
          </p>
        </section>
        <AccountForm
          configured={authConfigured()}
          initialMode={
            password
              ? "password"
              : query.mode === "signup"
                ? "signup"
                : "signin"
          }
          next={safeNext(query.next, locale)}
          expired={query.error === "expired"}
        />
      </div>
    </AccountLayout>
  );
}
