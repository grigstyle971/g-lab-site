"use client";
import { useState, type FormEvent } from "react";
import { useLocale } from "./LanguageProvider";
import { PurchaseAccessHelp } from "./PurchaseAccessHelp";
export function AccountForm({
  configured,
  initialMode = "signin",
  next,
  expired = false,
}: {
  configured: boolean;
  initialMode?: "signin" | "signup" | "reset" | "password";
  next?: string;
  expired?: boolean;
}) {
  const locale = useLocale(),
    ru = locale === "ru",
    prefix = ru ? "/ru" : "";
  const [mode, setMode] = useState(initialMode),
    [busy, setBusy] = useState(false),
    [codeStage, setCodeStage] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [showConfirmPassword, setShowConfirmPassword] = useState(false),
    [code, setCode] = useState(""),
    [termsAccepted, setTermsAccepted] = useState(false),
    [message, setMessage] = useState(
      expired
        ? ru
          ? "Старая ссылка восстановления больше не действует. Нажмите «Не помню пароль», чтобы получить новый код."
          : "That recovery link is no longer valid. Choose “Forgot your password” to request a fresh code."
        : "",
    );
  const titles = {
    signin: ru ? "Рады вас видеть" : "Welcome back",
    signup: codeStage
      ? ru
        ? "Подтвердите почту"
        : "Verify your email"
      : ru
        ? "Создайте аккаунт после покупки"
        : "Create your account after purchase",
    reset: codeStage
      ? ru
        ? "Задайте новый пароль"
        : "Choose a new password"
      : ru
        ? "Забыли пароль?"
        : "Forgot your password?",
    password: ru ? "Придумайте новый пароль" : "Choose a new password",
  };
  async function callAuth(action: string, token?: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          password,
          token,
          termsAccepted,
          locale,
          next,
        }),
      });
      const data = await response.json();
      if (data.error) {
        const messages: Record<string, string> = {
          credentials: ru
            ? "Проверьте почту, пароль и подтверждение адреса."
            : "Check your email, password and email confirmation.",
          "rate-limit": ru
            ? "Слишком много попыток. Подождите немного и попробуйте снова."
            : "Too many attempts. Wait a little and try again.",
          unavailable: ru
            ? "Сервис аккаунта временно недоступен. Повторите попытку через минуту; пароль не изменён."
            : "Account service is temporarily unavailable. Try again in a minute; your password has not changed.",
          origin: ru
            ? "Страница устарела. Обновите её и попробуйте снова."
            : "This page is out of date. Refresh it and try again.",
          retry: ru
            ? "Не удалось завершить запрос. Попробуйте ещё раз через минуту."
            : "We could not complete the request. Please try again in a minute.",
          password: ru
            ? "Для нового пароля нужно от 10 до 128 символов."
            : "Use between 10 and 128 characters for a new password.",
          signup: ru
            ? "Не удалось создать аккаунт. Попробуйте войти или повторить позже."
            : "We could not create the account. Try signing in or try again later.",
          "code-request": ru
            ? "Не получилось отправить код. Проверьте адрес и повторите позже."
            : "We could not send the code. Check the address and try again shortly.",
          "purchase-required": ru
            ? "Покупка для этой почты пока не подтверждена. Используйте адрес из чека Gumroad или ручного приглашения и повторите попытку через минуту. Повторно платить не нужно."
            : "A purchase for this email has not been confirmed yet. Use the address from your Gumroad receipt or manual invitation and try again in a minute. You do not need to pay again.",
          code: ru
            ? "Код не подошёл или истёк. Проверьте письмо и запросите новый код."
            : "That code is invalid or expired. Check the email or request a new code.",
          "password-update": ru
            ? "Код подтверждён, но пароль не сохранился. Проверьте требования к паролю и повторите."
            : "The code was verified, but the password was not saved. Check the password requirements and try again.",
          terms: ru
            ? "Чтобы создать аккаунт, примите условия курса."
            : "Accept the course terms to create an account.",
          expired: ru
            ? "Сначала откройте новое письмо для восстановления пароля."
            : "Open a fresh password recovery email first.",
        };
        setMessage(
          messages[data.error] ||
            (ru
              ? "Сейчас не получилось. Попробуйте чуть позже."
              : "That did not work. Please try again shortly."),
        );
      } else if (data.next) {
        window.location.assign(data.next);
      } else if (data.message === "code-sent" || data.message === "reset-code-sent") {
        setCodeStage(true);
        setCode("");
        if (data.message === "reset-code-sent") {
          setPassword("");
          setConfirmPassword("");
        }
        setMessage(
          data.message === "reset-code-sent"
            ? ru
              ? "Если аккаунт с этой почтой существует, на неё отправлен код. Введите самый свежий код и придумайте новый пароль. Код одноразовый и может истечь; не пересылайте его."
              : "If this email has an account, we sent a code. Enter the newest code and choose a new password. It is single-use and can expire; do not share it."
            : ru
              ? "Код G-lab отправлен на почту. Введите все цифры (6–10). Если вы не запрашивали его, проигнорируйте письмо и никому не сообщайте код."
              : "G-lab emailed a verification code. Enter all 6–10 digits. If you did not request it, ignore the email and do not share the code.",
        );
      } else
        setMessage(
          data.message === "reset"
            ? ru
              ? "Если аккаунт с этой почтой существует, на неё отправлено письмо."
              : "If this email has an account, a message has been sent."
            : ru
              ? "Проверьте почту: откройте письмо и подтвердите адрес. Если аккаунт уже есть, попробуйте войти."
              : "Check your inbox to confirm your email. If you already have an account, try signing in.",
        );
    } catch {
      setMessage(
        ru
          ? "Не удалось связаться с сервером. Проверьте интернет и повторите."
          : "Could not reach the server. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === "signup") {
      if (!codeStage) return callAuth("signup");
      return callAuth("verify-code", code);
    }
    if ((mode === "reset" && codeStage) || mode === "password") {
      if (password !== confirmPassword) {
        setMessage(
          ru ? "Пароли не совпадают. Проверьте оба поля." : "The passwords do not match. Check both fields.",
        );
        return;
      }
    }
    if (mode === "reset" && codeStage)
      return callAuth("verify-reset-code", code);
    return callAuth(mode);
  }
  return (
    <section className="account-form-card">
      <p className="account-eyebrow">
        G-LAB / {ru ? "ЛИЧНЫЙ КАБИНЕТ" : "YOUR ACCOUNT"}
      </p>
      <h1>{titles[mode]}</h1>
      <p>
        {ru
          ? mode === "signup"
            ? "Создать аккаунт можно после подтверждённой покупки курса или ручного приглашения владельца. Используйте ту же почту, придумайте пароль и введите код из письма."
            : mode === "reset"
              ? codeStage
                ? "Введите одноразовый код из письма и новый пароль. Если код истёк или вы запросили новый, используйте самый свежий код."
                : "Укажите почту аккаунта. Мы отправим код, чтобы вы могли задать новый пароль."
            : "Войдите, чтобы открыть курс и посмотреть покупки."
          : mode === "signup"
            ? "Create an account after Gumroad confirms your purchase or the owner grants manual access. Use that same email, choose a password and enter the code we email you."
            : mode === "reset"
              ? codeStage
                ? "Enter the one-time code from the email and choose a new password. If it expires or you request another, use the newest code."
                : "Enter the email on your account. We will send a code so you can choose a new password."
            : "Sign in to open your course and view your purchases."}
      </p>
      {!configured && (
        <p role="status">
          {ru
            ? "Личный кабинет временно не настроен. Попробуйте позже или напишите нам."
            : "The account service is not configured yet. Try again later or contact us."}
        </p>
      )}
      <form onSubmit={submit}>
        {mode !== "password" && (
          <label>
            {ru ? "Электронная почта" : "Email address"}
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy || !configured || codeStage}
            />
          </label>
        )}
        {mode === "reset" && codeStage && (
          <label>
            {ru ? "Код из письма" : "Email code"}
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              disabled={busy || !configured}
            />
          </label>
        )}
        {(mode !== "reset" || codeStage) && (
          <label>
            {ru ? "Пароль" : "Password"}
            <span className="account-password-field">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={mode === "signin" ? 1 : 10}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy || !configured}
              />
              <button
                className="account-password-toggle"
                type="button"
                aria-label={
                  showPassword
                    ? ru
                      ? "Скрыть пароль"
                      : "Hide password"
                    : ru
                      ? "Показать пароль"
                      : "Show password"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                  {showPassword ? (
                    <>
                      <circle cx="12" cy="12" r="3" />
                      <path d="m4 4 16 16" />
                    </>
                  ) : (
                    <circle cx="12" cy="12" r="3" />
                  )}
                </svg>
              </button>
            </span>
            {mode !== "signin" && (
              <small>
                {ru
                  ? "Не меньше 10 символов. Можно использовать длинную фразу."
                  : "At least 10 characters. A long phrase works well."}
              </small>
            )}
          </label>
        )}
        {mode === "signup" && codeStage && (
          <label>
            {ru ? "Код из письма" : "Email code"}
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              disabled={busy || !configured}
            />
          </label>
        )}
        {((mode === "reset" && codeStage) || mode === "password") && (
          <label>
            {ru ? "Повторите новый пароль" : "Confirm new password"}
            <span className="account-password-field">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={busy || !configured}
              />
              <button
                className="account-password-toggle"
                type="button"
                aria-label={
                  showConfirmPassword
                    ? ru
                      ? "Скрыть пароль"
                      : "Hide password"
                    : ru
                      ? "Показать пароль"
                      : "Show password"
                }
                aria-pressed={showConfirmPassword}
                onClick={() =>
                  setShowConfirmPassword((visible) => !visible)
                }
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" />
                  {showConfirmPassword ? (
                    <>
                      <circle cx="12" cy="12" r="3" />
                      <path d="m4 4 16 16" />
                    </>
                  ) : (
                    <circle cx="12" cy="12" r="3" />
                  )}
                </svg>
              </button>
            </span>
          </label>
        )}
        {mode === "signup" && !codeStage && (
          <div className="account-terms-consent">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
            <div>
              <label htmlFor="termsAccepted">
                {ru
                  ? "Я принимаю условия курса и ознакомился с уведомлением о данных."
                  : "I agree to the course terms and have read the privacy notice."}
              </label>
              <p className="account-terms-links">
                <a href={`${prefix}/terms`} target="_blank" rel="noreferrer">
                  {ru ? "Открыть условия курса" : "Read the course terms"}
                </a>
                {" · "}
                <a
                  href={`${prefix}/privacy`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {ru ? "Уведомление о данных" : "Privacy notice"}
                </a>
              </p>
            </div>
          </div>
        )}
        <button className="account-primary" disabled={busy || !configured}>
          {busy
            ? ru
              ? "Подождите…"
              : "Please wait…"
            : mode === "signin"
              ? ru
                ? "Войти"
                : "Sign in"
              : mode === "signup"
                ? codeStage
                  ? ru
                    ? "Подтвердить код и создать аккаунт"
                    : "Verify code and create account"
                  : ru
                    ? "Отправить код на почту"
                    : "Email me a verification code"
              : mode === "reset"
                  ? codeStage
                    ? ru
                      ? "Проверить код и сохранить пароль"
                      : "Verify code and save password"
                    : ru
                      ? "Отправить код для сброса"
                      : "Email me a reset code"
                  : ru
                    ? "Сохранить пароль"
                    : "Save password"}
        </button>
      </form>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {mode === "signup" && <PurchaseAccessHelp ru={ru} />}
      {(mode === "signup" || mode === "reset") && codeStage && (
        <div className="account-form-links">
          <button type="button" disabled={busy} onClick={() => callAuth(mode === "signup" ? "resend-code" : "reset")}>
            {ru ? "Отправить новый код" : "Send a new code"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setCodeStage(false);
              setCode("");
              if (mode === "reset") {
                setPassword("");
                setConfirmPassword("");
              }
              setMessage("");
            }}
          >
              {mode === "reset"
                ? ru ? "Изменить почту" : "Change email"
                : ru ? "Изменить почту или пароль" : "Change email or password"}
          </button>
        </div>
      )}
      {(mode === "signup" || mode === "reset" || mode === "signin") && (
        <div className="account-form-links">
          {mode === "signup" && (
            <button
              disabled={busy}
              onClick={() => {
                setMode("signin");
                setCodeStage(false);
                setCode("");
                setMessage("");
              }}
            >
              {ru ? "Уже есть аккаунт? Войти" : "Already have an account? Sign in"}
            </button>
          )}
          {mode === "reset" && (
          <button
            disabled={busy}
            onClick={() => {
              setMode("signin");
              setCodeStage(false);
                setCode("");
                setPassword("");
                setConfirmPassword("");
                setMessage("");
            }}
            >
              {ru ? "Вернуться ко входу" : "Back to sign in"}
            </button>
          )}
          {mode === "signin" && (
            <>
              <button
                disabled={busy}
                onClick={() => {
                  setMode("reset");
                  setMessage("");
                }}
              >
                {ru ? "Не помню пароль" : "Forgot password"}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setMode("signup");
                  setCodeStage(false);
                  setCode("");
                  setPassword("");
                  setMessage("");
                }}
              >
                {ru ? "Уже оплатили? Создать аккаунт" : "Already purchased? Create account"}
              </button>
            </>
          )}
        </div>
      )}
      {mode !== "signup" && (
        <a href={`${prefix}/course-checkout`}>
          {ru ? "Купить доступ к курсу →" : "Get course access →"}
        </a>
      )}
    </section>
  );
}
export function SignOutButton() {
  const ru = useLocale() === "ru",
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  return (
    <div>
      <button
        className="account-text-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(false);
          try {
            const r = await fetch("/api/account/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "signout" }),
            });
            if (!r.ok) throw new Error();
            localStorage.removeItem("g-lab-course-completed");
            localStorage.removeItem("g-lab-progress-owner");
            window.location.assign(ru ? "/ru/login" : "/login");
          } catch {
            setError(true);
            setBusy(false);
          }
        }}
      >
        {ru ? "Выйти" : "Sign out"}
      </button>
      {error && (
        <small role="status">
          {ru
            ? "Не удалось выйти. Повторите попытку."
            : "Could not sign out. Please try again."}
        </small>
      )}
    </div>
  );
}
