import { OwnerAccessPanel } from "../../components/OwnerAccessPanel";
import { OwnerProjectInbox } from "../../components/OwnerProjectInbox";
import { OwnerFeedback } from "../../components/OwnerStudents";
import { WorkspaceSetup } from "../../components/WorkspaceSetup";
import { DashboardShell } from "../../components/DashboardShell";
import { translate } from "../../lib/i18n/translate";
import { conciseGuide } from "../../lib/concise-course";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountLayout } from "../../components/AccountLayout";
import { PaymentStatus } from "../../components/PaymentStatus";
import { adminClient, currentAccount } from "../../lib/account/server";
import { COURSE_ID } from "../../lib/account/config";
import { lessons } from "../../lib/course";
export default async function DashboardPage({
  searchParams,
  locale = "en",
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  locale?: "en" | "ru";
}) {
  const ru = locale === "ru",
    prefix = ru ? "/ru" : "",
    query = await searchParams,
    { client, user } = await currentAccount();
  if (!user || !client) {
    const destination = query.payment === "pending" ? `${prefix}/account?payment=pending` : `${prefix}/account`;
    const mode = query.payment === "pending" ? "signup" : "signin";
    redirect(`${prefix}/login?mode=${mode}&next=${encodeURIComponent(destination)}`);
  }
  if (user.email_confirmed_at && user.email) {
    try {
      await adminClient().rpc("claim_course_manual_access_invite", {
        p_buyer_email: user.email,
      });
      if (query.payment === "pending") {
        await adminClient().rpc("claim_gumroad_pending_course_purchases", {
          p_buyer_email: user.email,
        });
      }
    } catch {
      // Retry on the next account view if the grant or Gumroad Ping is not ready.
    }
  }
  const [enrollment, progress, orders] = await Promise.all([
    client
      .from("course_enrollments")
      .select("active")
      .eq("user_id", user.id)
      .eq("course_id", COURSE_ID)
      .maybeSingle(),
    client.from("course_progress").select("lesson_slug").eq("user_id", user.id),
    client
      .from("course_orders")
      .select("id,provider,amount,currency,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const unavailable = Boolean(
      enrollment.error || progress.error || orders.error,
    ),
    access = Boolean(enrollment.data?.active),
    completed = new Set((progress.data || []).map((r) => r.lesson_slug)),
    count = lessons.filter((l) => completed.has(l.slug)).length;
  const next = lessons.find((l) => !completed.has(l.slug)) || lessons[0];
  const nextOverview = access ? conciseGuide(next.slug, locale) : null;
  const status: Record<string, string> = ru
    ? { pending: "Ожидает оплаты", paid: "Оплачено", refunded: "Возврат" }
    : { pending: "Awaiting payment", paid: "Paid", refunded: "Refunded" };
  const owner = user.email?.toLowerCase() === "grigstyle971@gmail.com" && Boolean(user.email_confirmed_at);
  const allowedSections = owner ? ["inquiries", "students", "feedback", "course", "orders", "settings"] : ["course", "orders", "settings"];
  const section = typeof query.section === "string" && allowedSections.includes(query.section) ? query.section : owner ? "inquiries" : "course";
  return (
    <AccountLayout locale={locale} dashboard>
      <DashboardShell locale={locale} owner={owner} section={section} email={user.email || ""} paymentPending={query.payment === "pending"}>
        {owner && section === "inquiries" && <OwnerProjectInbox ru={ru} />}
        {owner && section === "students" && <OwnerAccessPanel ru={ru} />}
        {owner && section === "feedback" && <OwnerFeedback ru={ru} />}
        {unavailable && (section === "course" || section === "orders") && (
          <div className="account-notice" role="status">
            {ru
              ? "Не удалось загрузить покупки и прогресс. Попробуйте позже или напишите нам. Ваш аккаунт доступен."
              : "We could not load purchases and progress. Try again later or contact us. Your account is available."}
          </div>
        )}
        {!access && query.payment === "pending" && <PaymentStatus />}
        {section === "course" && !unavailable && access && count === 0 && <section className="account-panel"><h2>{ru ? "Начните с одного небольшого сайта" : "Start with one small website"}</h2><ol><li>{ru ? "Выберите задачу: рассказать об услуге, собрать портфолио или принимать заявки." : "Choose a goal: describe a service, build a portfolio or collect enquiries."}</li><li>{ru ? "В первом уроке отправьте готовый запрос в Codex и откройте созданный сайт." : "In lesson one, send the ready-made request to Codex and open the website it builds."}</li><li>{ru ? "Проверьте главную кнопку, внесите одну правку и отметьте результат в конце урока." : "Try the main button, make one improvement and confirm your result at the end of the lesson."}</li></ol><Link className="account-primary" href={prefix + "/learn/welcome"}>{ru ? "Начать первый урок →" : "Start lesson one →"}</Link></section>}
        <div className="account-dashboard-grid">
          {section === "course" && (
          <section className="account-panel">
            <span className="account-badge">
              {access
                ? ru
                  ? "Курс доступен"
                  : "Course available"
                : ru
                  ? "Нужна покупка"
                  : "Purchase required"}
            </span>
            <h2 className="account-course-title">
              {ru ? "Создание сайтов с Codex" : "Build & launch with Codex"}
            </h2>
            <p>
              {ru
                ? "16 уроков. Один сайт: от идеи до публикации и личного кабинета."
                : "16 lessons. One website, from your first idea to launch and client accounts."}
            </p>
            {access ? (
              <>
                <div
                  className="account-progress-bar"
                  role="progressbar"
                  aria-label={ru ? "Прогресс курса" : "Course progress"}
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={lessons.length}
                >
                  <span
                    style={{ width: `${(count / lessons.length) * 100}%` }}
                  />
                </div>
                <p>
                  {ru
                    ? `Пройдено ${count} из ${lessons.length} уроков`
                    : `${count} of ${lessons.length} lessons complete`}
                </p>
                <h3>{count === lessons.length ? (ru ? "Все уроки пройдены. Проверьте итоговый проект." : "All lessons complete. Review your final project.") : nextOverview?.title}</h3>
                <p>{count === lessons.length ? (ru ? "Повторите основные действия на опубликованном сайте и выберите следующее улучшение." : "Repeat the main actions on your published site and choose your next improvement.") : nextOverview?.summary}</p>
                {count === lessons.length && <Link className="account-secondary" href={prefix + "/learn/client-space#evidence"}>{ru ? "К выпускному проекту →" : "Review final project →"}</Link>}
                <ol className="account-module-progress">{["01","02","03","04"].map(number => {const group = lessons.filter(l => l.moduleNumber === number);return <li key={number}><span>{translate(group[0].module,locale)}</span><strong>{group.filter(l => completed.has(l.slug)).length} / {group.length}</strong></li>})}</ol>
              </>
            ) : null}
            <div className="account-course-actions">
              <Link
                className="account-primary"
                href={access ? `${prefix}/learn/${next.slug}` : `${prefix}/course-checkout`}
              >
                {access
                  ? count === lessons.length
                    ? (ru ? "Повторить курс →" : "Revisit the course →")
                    : (ru ? "Продолжить урок →" : "Continue lesson →")
                  : (ru ? "Открыть весь курс →" : "Get the full course →")}
              </Link>
              <Link className="account-secondary" href={`${prefix}/learn`}>
                {ru ? "Программа курса" : "Course roadmap"}
              </Link>
            </div>
          </section>
          )}
          {section === "settings" && <section className="account-panel">
            <h2>{ru ? "Ваш аккаунт" : "Account settings"}</h2>
            <p>
              {ru
                ? "Вход по электронной почте и паролю. Если захотите сменить пароль, это можно сделать здесь."
                : "Sign in with your email and password. You can change your password here whenever you need to."}
            </p>
            <Link
              className="account-secondary"
              href={`${prefix}/account/password`}
            >
              {ru ? "Сменить пароль" : "Change password"}
            </Link>
            <p>
              <a href="mailto:glab.tech.support@gmail.com">
                {ru ? "Нужна помощь? Напишите нам" : "Need a hand? Contact us"}
              </a>
            </p>
          </section>}
        </div>
        {section === "settings" && owner && <WorkspaceSetup ru={ru} />}
        {section === "orders" && <section className="account-panel">
          <h2>{ru ? "История заказов" : "Order history"}</h2>
          {orders.error ? (
            <p className="account-empty" role="status">
              {ru ? "Не удалось загрузить историю заказов. Обновите страницу или напишите нам." : "We could not load your order history. Refresh the page or contact us."}
            </p>
          ) : !orders.data?.length ? (
            <>
              <p className="account-empty">
                {access
                  ? (ru ? "Курс вам доступен, но записей об оплате в этом аккаунте пока нет. Если доступ выдан вручную, отдельный заказ не создаётся." : "You have course access, but this account has no payment records yet. Manually granted access does not create an order.")
                  : (ru ? "Заказов пока нет. После оформления покупки здесь появятся дата, сумма и статус заказа на курс." : "No orders yet. After checkout, this section will show the date, amount and status of your course order.")}
              </p>
              {!enrollment.error && !access && query.payment === "pending" && <p className="account-empty">{ru ? "Подтверждение оплаты ещё ожидается. Воспользуйтесь кнопкой «Проверить оплату» выше." : "Payment confirmation is still pending. Use the “Check payment” button above."}</p>}
            </>
          ) : (
            <ul className="account-orders">
              {orders.data.map((order) => (
                <li key={order.id}>
                  <div>
                    <strong>
                      {order.provider === "gumroad"
                        ? "Gumroad"
                        : order.provider === "stripe"
                          ? "Stripe"
                          : "Prodamus"}
                    </strong>
                    <small>
                      {new Intl.DateTimeFormat(ru ? "ru-RU" : "en-GB", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(order.created_at))}
                    </small>
                    <small>
                      {ru ? "Заказ" : "Order"} {order.id.slice(0, 8)}
                    </small>
                  </div>
                  <div>
                    <strong>
                      {new Intl.NumberFormat(ru ? "ru-RU" : "en-US", {
                        style: "currency",
                        currency: order.currency.toUpperCase(),
                      }).format(order.amount / 100)}
                    </strong>
                    <small>{status[order.status] || order.status}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <a className="account-orders-help" href="mailto:glab.tech.support@gmail.com">
            {ru ? "Оплатили, но заказа нет? Напишите нам" : "Paid but cannot see your order? Contact us"}
          </a>
        </section>}
      </DashboardShell>
    </AccountLayout>
  );
}
