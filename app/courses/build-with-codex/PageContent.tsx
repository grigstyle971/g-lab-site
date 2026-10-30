"use client";
import { useLocale } from "../../../components/LanguageProvider";
import { CourseBuyButton } from "../../../components/CourseBuyButton";
import { ArrowIcon } from "../../../components/ArrowIcon";
import { GlFooter, GlNav } from "../../../components/GlChrome";
import { lessons } from "../../../lib/course";
import { translate } from "../../../lib/i18n/translate";

const courseStages = [
  {
    number: "01",
    tool: "Codex",
    title: ["Build with Codex", "Создайте сайт с Codex"],
    summary: [
      "Plan a useful page, shape its content and design, then diagnose a broken interaction.",
      "Спланируйте страницу, подготовьте содержание и дизайн, затем научитесь исправлять ошибки.",
    ],
  },
  {
    number: "02",
    tool: "GitHub",
    title: ["Save and recover with GitHub", "Сохраняйте и восстанавливайте версии в GitHub"],
    summary: [
      "Connect the project, save purposeful changes and recover a known working version.",
      "Подключите проект, сохраняйте изменения и возвращайтесь к проверенной версии.",
    ],
  },
  {
    number: "03",
    tool: "Vercel",
    title: ["Publish and improve with Vercel", "Публикуйте и улучшайте сайт с Vercel"],
    summary: [
      "Deploy the website, test it as a visitor and review updates before release.",
      "Опубликуйте сайт, проверьте его как посетитель и тестируйте обновления до выпуска.",
    ],
  },
  {
    number: "04",
    tool: "Supabase",
    title: ["Connect accounts and data with Supabase", "Подключите аккаунты и данные через Supabase"],
    summary: [
      "Add sign-in, password recovery and private saved requests, then verify account boundaries.",
      "Добавьте вход, восстановление пароля и личные заявки, затем проверьте доступ между аккаунтами.",
    ],
  },
];

export default function BuildWithCodexPage({
  checkoutAvailable = false,
  fontClass = "",
}: {
  checkoutAvailable?: boolean;
  fontClass?: string;
}) {
  const ru = useLocale() === "ru",
    prefix = ru ? "/ru" : "",
    text = (en: string, russian: string) => (ru ? russian : en);

  const faq = [
    {
      question: text("Is this a video course?", "Это видеокурс?"),
      answer: text(
        "It is a guided written course: 16 lessons with visual walkthroughs, copyable Codex prompts, hands-on tasks, troubleshooting and self-checks.",
        "Это практический курс в письменном формате: 16 уроков с наглядными разборами, готовыми запросами для Codex, заданиями, решениями частых проблем и самопроверкой.",
      ),
    },
    {
      question: text("What will I build?", "Что я создам?"),
      answer: text(
        "You will build and publish a small business website, then add sign-in and a private area where clients can save requests. Online booking, payment processing and email notifications are separate features.",
        "Вы создадите и опубликуете сайт небольшого бизнеса, затем добавите вход и личный раздел, где клиенты смогут сохранять заявки. Онлайн-запись, приём оплаты и уведомления по почте в курс не входят.",
      ),
    },
    {
      question: text("Do I need coding experience?", "Нужен ли опыт программирования?"),
      answer: text(
        "No. You describe what to build, review Codex’s changes and check the result. The guided local build requires a Windows or Mac computer and Codex availability for your account and location.",
        "Нет. Вы объясняете задачу, проверяете изменения Codex и тестируете результат. Для сборки нужен компьютер с Windows или Mac и доступность Codex для вашего аккаунта и страны.",
      ),
    },
    {
      question: text("Are tools, hosting, a domain and email delivery included?", "Включены ли инструменты, хостинг, домен и доставка писем?"),
      answer: text(
        "$19 covers course access. ChatGPT/Codex plans, a domain, commercial hosting and custom SMTP email delivery may cost extra. Supabase Free’s built-in sender only delivers to project team addresses; delivery to other inboxes requires custom SMTP. Provider prices and limits vary by country.",
        "$19 — это стоимость доступа к курсу. Тарифы ChatGPT/Codex, домен, коммерческий хостинг и собственная SMTP-доставка писем могут оплачиваться отдельно. Встроенный отправитель Supabase Free доставляет письма только участникам команды проекта; для других адресов нужен свой SMTP-сервис. Цены и лимиты сервисов зависят от страны.",
      ),
    },
    {
      question: text("How do I open the course after paying?", "Как открыть курс после оплаты?"),
      answer: text(
        "Use the email address on your Gumroad receipt to create or sign in to your G-lab account, then verify that email. The lessons appear after Gumroad confirms the order.",
        "Используйте почту из чека Gumroad, чтобы войти или создать аккаунт G-lab, затем подтвердите адрес. Уроки откроются после подтверждения заказа Gumroad.",
      ),
    },
    {
      question: text("Can I get personal feedback on my website?", "Проверит ли автор мой сайт лично?"),
      answer: text(
        "Each lesson lets you send the course owner a note about a confusing step. The course is self-paced and does not include a promised reply time, live tutoring or an individual review of your code or finished website.",
        "В каждом уроке можно отправить автору сообщение о непонятном шаге. Курс самостоятельный: в него не входят обещанный срок ответа, занятия с преподавателем или индивидуальная проверка кода и готового сайта.",
      ),
    },
  ];

  return (
    <main className={`gl ${fontClass}`}>
      <GlNav ru={ru} current="course" />

      <section className="gl-page-hero gl-wrap gl-split">
        <div>
          <h1>{text("Build your website ", "Создайте сайт ")}<i>{text("with Codex.", "вместе с Codex.")}</i></h1>
          <p className="gl-lead">
            {text(
              "A guided written course with visual walkthroughs, copyable prompts and hands-on checks. Start with no coding experience and build a published website.",
              "Пошаговый письменный курс с наглядными разборами, готовыми запросами и практическими проверками. Создайте сайт с нуля, без опыта программирования.",
            )}
          </p>
          <p className="gl-facts">{text("16 clear lessons · Codex, GitHub, Vercel and Supabase · learn at your pace", "16 понятных уроков · Codex, GitHub, Vercel и Supabase · в удобном темпе")}</p>
        </div>
        <div className="gl-buybox">
          <p className="gl-price">$19</p>
          <p className="gl-buybox-sub">{text("One-time purchase · all 16 lessons", "Разовая покупка · все 16 уроков")}</p>
          <div className="gl-acts"><CourseBuyButton available={checkoutAvailable} /></div>
          <p className="gl-note">{text("Gumroad shows any required VAT or sales tax before payment.", "Gumroad покажет НДС или налог с продаж до оплаты, если они применяются.")}</p>
          <a className="gl-more" href={`${prefix}/course-checkout`}>{text("Already bought? Open your course", "Уже купили? Откройте курс")} <ArrowIcon /></a>
          <p className="gl-note">
            {text(
              "This course uses Codex in the ChatGPT desktop app with a local project folder. Steps are written for Windows and Mac; supported Linux systems may need adapting. A phone or tablet cannot complete the build.",
              "В курсе Codex работает в настольном приложении ChatGPT с локальной папкой проекта. Шаги написаны для Windows и Mac; на поддерживаемом Linux некоторые действия могут отличаться. На телефоне или планшете проект не собрать.",
            )}{" "}
            <a href="https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan" target="_blank" rel="noopener noreferrer">
              {text("Check desktop app setup", "Проверить установку приложения")}
            </a>
          </p>
        </div>
      </section>

      <section className="gl-sec gl-dark">
        <div className="gl-wrap gl-split">
          <div>
            <h2 className="gl-h2">
              {text(
                "A live website with a private client area — built by you.",
                "Работающий сайт с личным кабинетом для клиентов — созданный вами.",
              )}
            </h2>
            <p className="gl-sub">
              {text(
                "Publish it, share the link and give each client a secure place to sign in.",
                "Опубликуйте сайт, поделитесь ссылкой и дайте клиентам безопасный личный кабинет.",
              )}
            </p>
            <p className="gl-note gl-note--dark">
              {text(
                "The client area includes account sign-in and private saved requests. Online booking, payment processing and email notifications are separate features.",
                "В кабинете есть вход и сохранение личных заявок. Онлайн-запись, приём оплаты и уведомления по почте — отдельные функции.",
              )}
            </p>
          </div>
          <div className="gl-browser gl-result" aria-hidden="true">
            <div className="gl-bar"><i /><i /><i /><span>{text("your-site.com", "vash-sait.ru")}</span><b>{text("live", "опубликовано")}</b></div>
            <div className="gl-result-body">
              <span>{text("Your website", "Ваш сайт")}</span>
              <strong>{text("Idea → Live", "Идея → Запуск")}</strong>
              <i>{text("Client area", "Личный кабинет")} <ArrowIcon /></i>
            </div>
          </div>
        </div>
      </section>

      <section className="gl-sec gl-wrap" id="course-overview">
        <h2 className="gl-h2">{text("A clear path from idea to launch.", "Понятный путь от идеи до запуска.")}</h2>
        <p className="gl-sub">
          {text(
            "Four stages with step-by-step written lessons, copyable Codex prompts, hands-on tasks and checks. Learn at your own pace; no coding experience is required.",
            "Четыре этапа: пошаговые письменные уроки, готовые запросы для Codex, практика и проверки. Учитесь в удобном темпе; опыт программирования не нужен.",
          )}
        </p>
        <div className="gl-stages">
          {courseStages.map((stage) => (
            <article key={stage.number}>
              <span className="gl-tag">{stage.number} · {stage.tool} · {text("4 lessons", "4 урока")}</span>
              <h3>{text(stage.title[0], stage.title[1])}</h3>
              <p>{text(stage.summary[0], stage.summary[1])}</p>
              <details>
                <summary>{text("See all four lessons", "Все четыре урока")}</summary>
                <ol>
                  {lessons
                    .filter((lesson) => lesson.moduleNumber === stage.number)
                    .map((lesson) => (
                      <li key={lesson.slug}>
                        <span>{lesson.number}</span>
                        <div>
                          <strong>{translate(lesson.title, ru ? "ru" : "en")}</strong>
                          <small>{translate(lesson.duration, ru ? "ru" : "en")}</small>
                        </div>
                      </li>
                    ))}
                </ol>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="gl-sec gl-wrap gl-split gl-split--top">
        <div>
          <h2 className="gl-h2">{text("Before you buy", "Перед покупкой")}</h2>
          <p className="gl-sub">
            {text(
              "After checkout, use your receipt email to create or sign in to G-lab; verify it and all 16 lessons unlock when Gumroad confirms your order.",
              "После покупки войдите или создайте аккаунт G-lab с почтой из чека и подтвердите её — после проверки заказа откроются все 16 уроков.",
            )}
          </p>
          <p className="gl-note">
            {text(
              "Codex is included with ChatGPT plans where available; usage limits vary. You can follow the Supabase exercises on its Free plan; Pro is optional for learning. Supabase’s built-in auth email sender only reaches addresses on the project team; sending to other inboxes requires custom SMTP, whose provider or sender domain may cost extra. ChatGPT/Codex, domains, commercial hosting and paid Supabase production features may also have separate costs. Availability, quotas and prices vary by provider and country; Vercel Hobby is for personal, non-commercial projects.",
              "Codex входит в тарифы ChatGPT в поддерживаемых регионах; лимиты зависят от плана. Упражнения с Supabase можно выполнять на Free — Pro покупать ради обучения не нужно. Встроенная почта Supabase отправляет письма только участникам команды проекта; для других адресов нужен свой SMTP-сервис, провайдер или домен отправителя могут оплачиваться отдельно. У ChatGPT/Codex, домена, коммерческого хостинга и платных функций Supabase в production тоже могут быть отдельные расходы. Доступность, лимиты и цены зависят от сервиса и страны; Vercel Hobby предназначен для личных некоммерческих проектов.",
            )}
          </p>
        </div>
        <div className="gl-faq" aria-labelledby="course-faq-title">
          <h2 id="course-faq-title" className="gl-h3">{text("Questions before you start.", "Что важно знать до начала.")}</h2>
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="gl-sec gl-course gl-final">
        <div className="gl-wrap">
          <h2 className="gl-h2">{text("Ready to build a website of your own?", "Готовы создать собственный сайт?")}</h2>
          <p className="gl-sub">{text("One-time access to all 16 lessons · $19 USD", "Разовый доступ ко всем 16 урокам · $19 USD")}</p>
          <div className="gl-acts"><CourseBuyButton available={checkoutAvailable} /></div>
        </div>
      </section>

      <GlFooter ru={ru} />
    </main>
  );
}
