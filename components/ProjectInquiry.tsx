"use client";

import { useState, type FormEvent } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { useLocale } from "./LanguageProvider";
import { marketingEvent } from "../lib/marketing-events";
import { estimateProjectPrice, type ProjectType } from "../lib/project-pricing";
import { captureCampaignAttribution } from "../lib/campaign-attribution";

const projectTypes = ["website", "landing", "portal", "automation", "other"] as const;
type Timeline = "soon" | "month" | "planning";
type Budget = "under-1000" | "1000-3000" | "3000-plus" | "not-sure";

const pageKeys = ["home", "about", "services", "product", "work", "pricing", "faq", "contact", "blog", "account", "other", "unsure"] as const;
const featureKeys = ["form", "booking", "payments", "accounts", "catalog", "search", "languages", "cms", "admin", "analytics", "integrations", "other", "unsure"] as const;
const styleKeys = ["minimal", "premium", "bold", "cinematic", "friendly", "reference", "unsure"] as const;
const assetKeys = ["ready", "partial", "need-help", "unsure"] as const;
const domainKeys = ["have", "need", "unsure"] as const;

type ProjectBrief = {
  audience: string;
  pages: string[];
  customPages: string;
  features: string[];
  customFeatures: string;
  visualStyle: string;
  references: string;
  assets: string;
  domain: string;
  existingTools: string;
};

export function ProjectInquiry() {
  const ru = useLocale() === "ru";
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType | "">("");
  const [summary, setSummary] = useState("");
  const [brief, setBrief] = useState<ProjectBrief>({
    audience: "", pages: [], customPages: "", features: [], customFeatures: "",
    visualStyle: "", references: "", assets: "", domain: "", existingTools: "",
  });
  const [timeline, setTimeline] = useState<Timeline | "">("");
  const [budgetRange, setBudgetRange] = useState<Budget | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const labels: Record<string, string> = ru
    ? { website: "Сайт для бизнеса", landing: "Лендинг", portal: "Личный кабинет или портал", automation: "Автоматизация с ИИ", other: "Другое" }
    : { website: "Business website", landing: "Landing page", portal: "Client portal", automation: "AI workflow", other: "Something else" };
  const pages: Record<string, string> = ru
    ? { home: "Главная", about: "О компании", services: "Услуги", product: "Товары / продукты", work: "Портфолио", pricing: "Цены", faq: "Вопросы и ответы", contact: "Контакты", blog: "Статьи / новости", account: "Личный кабинет", other: "Другая страница", unsure: "Пока не знаю" }
    : { home: "Home", about: "About", services: "Services", product: "Products", work: "Portfolio", pricing: "Pricing", faq: "FAQ", contact: "Contact", blog: "Blog / news", account: "Client account", other: "Another page", unsure: "Not sure yet" };
  const features: Record<string, string> = ru
    ? { form: "Формы заявок", booking: "Запись / бронирование", payments: "Оплата онлайн", accounts: "Аккаунты клиентов", catalog: "Каталог / фильтры", search: "Поиск", languages: "Несколько языков", cms: "Блог / редактирование контента", admin: "Админ-панель", analytics: "Аналитика", integrations: "Связь с другими сервисами", other: "Другая функция", unsure: "Пока не знаю" }
    : { form: "Enquiry forms", booking: "Booking / scheduling", payments: "Online payments", accounts: "Customer accounts", catalog: "Catalogue / filters", search: "Search", languages: "Multiple languages", cms: "Blog / content editing", admin: "Admin dashboard", analytics: "Analytics", integrations: "Connect other services", other: "Another feature", unsure: "Not sure yet" };
  const styles: Record<string, string> = ru
    ? { minimal: "Минималистичный", premium: "Премиальный", bold: "Смелый и выразительный", cinematic: "Кинематографичный / технологичный", friendly: "Дружелюбный", reference: "Покажу пример", unsure: "Нужна помощь с выбором" }
    : { minimal: "Minimal", premium: "Premium", bold: "Bold and expressive", cinematic: "Cinematic / technology-led", friendly: "Friendly", reference: "I have a reference", unsure: "Help me choose" };
  const assetsLabels: Record<string, string> = ru
    ? { ready: "Есть логотип, тексты и фото", partial: "Что-то уже есть", "need-help": "Нужна помощь с материалами", unsure: "Пока не знаю" }
    : { ready: "Logo, copy and images are ready", partial: "I have some materials", "need-help": "I need help with content/assets", unsure: "Not sure yet" };
  const domainLabels: Record<string, string> = ru
    ? { have: "Есть домен / хостинг", need: "Нужно помочь настроить", unsure: "Пока не знаю" }
    : { have: "I have a domain / hosting", need: "Help me set them up", unsure: "Not sure yet" };
  const timelines: Record<Timeline, string> = ru
    ? { soon: "Как можно скорее", month: "В течение месяца", planning: "Пока планирую" }
    : { soon: "As soon as possible", month: "Within a month", planning: "Just exploring" };
  const budgets: Record<Budget, string> = ru
    ? { "under-1000": "До $1,000", "1000-3000": "$1,000–3,000", "3000-plus": "$3,000+", "not-sure": "Пока не знаю" }
    : { "under-1000": "Under $1,000", "1000-3000": "$1,000–3,000", "3000-plus": "$3,000+", "not-sure": "Not sure yet" };
  const stepCount = 8;
  const estimate = projectType ? estimateProjectPrice({
    projectType,
    pages: brief.pages,
    customPages: brief.customPages,
    features: brief.features,
  }) : null;
  const price = (amount: number) => `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;

  function updateBrief<Key extends keyof ProjectBrief>(key: Key, value: ProjectBrief[Key]) {
    setBrief((current) => ({ ...current, [key]: value }));
  }

  function renderChoices(key: "pages" | "features", options: readonly string[], dictionary: Record<string, string>) {
    const selected = brief[key];
    return <fieldset className="project-multi-field">
      <legend className="visually-hidden">{ru ? "Выберите подходящие варианты" : "Choose all that apply"}</legend>
      <div className="project-choice-grid project-choice-grid--multi">
        {options.map((option) => {
          const active = selected.includes(option);
          return <button key={option} type="button" className={active ? "is-selected" : ""} aria-pressed={active}
            onClick={() => {
              const unsureKey = "unsure";
              const next = option === unsureKey
                ? (active ? [] : [unsureKey])
                : active
                  ? selected.filter((item) => item !== option)
                  : [...selected.filter((item) => item !== unsureKey), option];
              updateBrief(key, next);
            }}>
            <span>{dictionary[option]}</span><span className="project-choice-check" aria-hidden="true">{active ? "✓" : "+"}</span>
          </button>;
        })}
      </div>
    </fieldset>;
  }

  function answerFor(previousStep: number) {
    if (previousStep === 0) return `${labels[projectType]} · ${summary}`;
    if (previousStep === 1) return brief.audience;
    if (previousStep === 2) return [...brief.pages.map((key) => pages[key]), brief.customPages].filter(Boolean).join(", ");
    if (previousStep === 3) return [...brief.features.map((key) => features[key]), brief.customFeatures].filter(Boolean).join(", ");
    if (previousStep === 4) return [styles[brief.visualStyle], assetsLabels[brief.assets], brief.references].filter(Boolean).join(" · ");
    if (previousStep === 5) return [domainLabels[brief.domain], brief.existingTools].filter(Boolean).join(" · ");
    return `${timelines[timeline as Timeline]} · ${budgets[budgetRange as Budget]}`;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !consent) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/project-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, projectType, summary, projectBrief: brief, timeline, budgetRange, locale: ru ? "ru" : "en", website: honeypot, attribution: captureCampaignAttribution() }),
      });
      const result = await response.json();
      if (!response.ok) {
        marketingEvent("inquiry_failed", "brief");
        setMessage(result.error === "limit"
          ? (ru ? "Заявок с этого устройства уже много. Попробуйте чуть позже или напишите на почту ниже." : "There have been several requests from this device. Please try later or use the email below.")
          : result.error === "setup"
            ? (ru ? "Форма пока не подключена. Напишите на почту ниже, и заявка не потеряется." : "The form is not connected yet. Use the email below so your request reaches me.")
            : (ru ? "Не удалось отправить. Проверьте поля и попробуйте ещё раз." : "Could not send. Check the fields and try again."));
        return;
      }
      setSent(true);
      marketingEvent("inquiry_submitted", "brief");
    } catch {
      marketingEvent("inquiry_failed", "brief");
      setMessage(ru ? "Нет связи с сервером. Попробуйте ещё раз или напишите на почту ниже." : "Could not reach the server. Retry or use the email below.");
    } finally {
      setBusy(false);
    }
  }

  const stepValid = step === 0 ? Boolean(projectType && summary.trim().length >= 3)
    : step === 1 ? brief.audience.trim().length >= 3
      : step === 2 ? brief.pages.length > 0
        : step === 3 ? brief.features.length > 0
          : step === 4 ? Boolean(brief.visualStyle && brief.assets)
            : step === 5 ? Boolean(brief.domain)
              : step === 6 ? Boolean(timeline && budgetRange)
                : consent;

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0) marketingEvent("inquiry_started", "brief");
    setMessage("");
    setStep((current) => Math.min(stepCount - 1, current + 1));
  }
  function changeStep(target: number) {
    setMessage("");
    setStep(target);
  }

  const prompts = ru
    ? ["Какой цифровой продукт нужен и что он должен изменить для вашего бизнеса?", "Кто ваши клиенты и для кого мы создаём сайт?", "Какие страницы понадобятся? Можно выбрать несколько.", "Что посетитель должен уметь делать на сайте?", "Какой визуальный стиль ближе? Материалы можно добавить позже.", "Есть ли домен или сервисы, с которыми нужно связать сайт?", "Когда хотите запуститься и какой бюджет планируете?", "Куда отправить ответ по проекту?"]
    : ["What do you want to build, and what should it change for your business?", "Who are your customers, and who is this site for?", "Which pages will you need? Choose as many as you like.", "What should visitors be able to do on the site?", "What visual direction feels right? You can add assets later.", "Do you have a domain or tools the site should connect to?", "When would you like to launch, and what budget do you have in mind?", "Where should I send the project reply?"];

  return <section className="project-inquiry" aria-label={ru ? "Заказать сайт" : "Start a project"}>
    <div className="project-inquiry-head">
      <span className="project-inquiry-signal" aria-hidden="true" />
      <p>{ru ? "НОВЫЙ ПРОЕКТ / БРИФ" : "NEW PROJECT / BRIEF"}</p>
      <span className="project-inquiry-step">{String(Math.min(step + 1, stepCount)).padStart(2, "0")} / {String(stepCount).padStart(2, "0")}</span>
    </div>
    <div className="project-inquiry-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / stepCount) * 100}%` }} /></div>
    <div className="project-chat" aria-live="polite">
      {Array.from({ length: step }).map((_, previousStep) => <button key={previousStep} type="button" className="project-chat-answer project-chat-answer--wide" onClick={() => changeStep(previousStep)}>
        <small>{ru ? `ШАГ ${String(previousStep + 1).padStart(2, "0")}` : `STEP ${String(previousStep + 1).padStart(2, "0")}`}</small>{answerFor(previousStep) || (ru ? "Ответ не указан" : "No answer provided")}
      </button>)}
      <div className="project-chat-prompt">
        <span className="project-chat-avatar" aria-hidden="true">G</span>
        <p>{sent ? (ru ? "Готово. Я изучу бриф и отвечу вам на почту." : "All set. I’ll review your brief and reply by email.") : prompts[step]}</p>
      </div>
    </div>

    {!sent && estimate && <aside className="project-price-estimate" aria-live="polite" aria-atomic="true">
      <div>
        <p>{ru ? "ОРИЕНТИР ПО ВЫБРАННОМУ ОБЪЁМУ" : "ESTIMATE FOR THE SELECTED SCOPE"}</p>
        <strong>{price(estimate.minimum)}–{price(estimate.maximum)} <span>USD</span></strong>
      </div>
      <small>{ru
        ? "Предварительный диапазон обновляется по вашим ответам. Точную фиксированную смету согласуем до начала работ; домен, хостинг и платные сторонние сервисы оплачиваются отдельно."
        : "A preliminary range that updates with your answers. I’ll confirm a fixed quote before work begins; domain, hosting and paid third-party services are separate."}</small>
    </aside>}

    {sent ? <p className="project-inquiry-success" role="status">{ru ? "Бриф сохранён в закрытом кабинете G-lab. В нём есть цели, структура, функции и технические пожелания." : "Your brief is saved in the private G-lab inbox with the goals, structure, features and technical notes."}</p> : (
      <form className="project-inquiry-form" onSubmit={step === stepCount - 1 ? submit : next}>
        <label className="project-inquiry-honeypot" aria-hidden="true" tabIndex={-1}>Website <input name="website" autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} tabIndex={-1} /></label>

        {step === 0 && <>
          <fieldset className="project-inquiry-group"><legend>{ru ? "Что создаём?" : "What are we building?"}</legend>
            <div className="project-choice-grid">{projectTypes.map((type) => <button key={type} type="button" className={projectType === type ? "is-selected" : ""} aria-pressed={projectType === type} onClick={() => setProjectType(type)}>{labels[type]}<span aria-hidden="true"><ArrowIcon /></span></button>)}</div>
          </fieldset>
          <div className="project-inquiry-details">
            <label>{ru ? "Чем занимается ваш бизнес и какой результат нужен от сайта?" : "What does your business do, and what should the site help achieve?"}
              <textarea required minLength={3} maxLength={1800} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder={ru ? "Например: студия йоги хочет рассказывать о занятиях и получать записи…" : "For example: a yoga studio wants to explain classes and receive bookings…"} />
              <p className="project-inquiry-hint">{ru ? "Достаточно пары слов — детали уточним дальше." : "A few words are enough; we’ll refine the details next."}</p>
            </label>
          </div>
        </>}
        {step === 1 && <div className="project-inquiry-details"><label>{ru ? "Кто обычно покупает у вас или пользуется услугой?" : "Who usually buys from you or uses your service?"}
          <textarea required minLength={3} maxLength={700} rows={3} value={brief.audience} onChange={(event) => updateBrief("audience", event.target.value)} placeholder={ru ? "Например: владельцы небольших кафе в Нью-Йорке…" : "For example: owners of small cafés in New York…"} />
        </label></div>}
        {step === 2 && <div className="project-inquiry-details">
          <p className="project-inquiry-hint">{ru ? "Это черновая структура — её можно уточнить вместе." : "This is a starting structure; we can refine it together."}</p>
          {renderChoices("pages", pageKeys, pages)}
          {brief.pages.includes("other") && <label>{ru ? "Какие ещё страницы?" : "What other pages?"}<input required maxLength={500} value={brief.customPages} onChange={(event) => updateBrief("customPages", event.target.value)} /></label>}
        </div>}
        {step === 3 && <div className="project-inquiry-details">
          <p className="project-inquiry-hint">{ru ? "Выберите всё подходящее. Если пока не решили — так и отметьте." : "Choose everything that applies. If you have not decided, say so."}</p>
          {renderChoices("features", featureKeys, features)}
          {brief.features.includes("other") && <label>{ru ? "Опишите другую функцию" : "Describe the other feature"}<input required maxLength={500} value={brief.customFeatures} onChange={(event) => updateBrief("customFeatures", event.target.value)} /></label>}
        </div>}
        {step === 4 && <div className="project-inquiry-details">
          <label>{ru ? "Визуальное направление" : "Visual direction"}<select required value={brief.visualStyle} onChange={(event) => updateBrief("visualStyle", event.target.value)}><option value="" disabled>{ru ? "Выберите или попросите помочь" : "Choose or ask for guidance"}</option>{styleKeys.map((key) => <option value={key} key={key}>{styles[key]}</option>)}</select></label>
          {brief.visualStyle === "reference" && <label>{ru ? "Ссылки на сайты, которые нравятся" : "Links to sites you like"}<input type="text" required maxLength={1000} value={brief.references} onChange={(event) => updateBrief("references", event.target.value)} placeholder="https://…" /></label>}
          <label>{ru ? "Какие материалы уже есть?" : "What materials do you already have?"}<select required value={brief.assets} onChange={(event) => updateBrief("assets", event.target.value)}><option value="" disabled>{ru ? "Выберите" : "Choose"}</option>{assetKeys.map((key) => <option value={key} key={key}>{assetsLabels[key]}</option>)}</select></label>
          {brief.visualStyle !== "reference" && <label>{ru ? "Примеры сайтов или детали стиля (необязательно)" : "Reference sites or style details (optional)"}<input maxLength={1000} value={brief.references} onChange={(event) => updateBrief("references", event.target.value)} placeholder={ru ? "Ссылки, цвета, настроение…" : "Links, colours, mood…"} /></label>}
        </div>}
        {step === 5 && <div className="project-inquiry-details">
          <label>{ru ? "Домен и размещение сайта" : "Domain and website hosting"}<select required value={brief.domain} onChange={(event) => updateBrief("domain", event.target.value)}><option value="" disabled>{ru ? "Выберите" : "Choose"}</option>{domainKeys.map((key) => <option value={key} key={key}>{domainLabels[key]}</option>)}</select></label>
          <label>{ru ? "Инструменты, которые уже используете или хотите подключить" : "Tools you already use or want to connect"}
            <textarea maxLength={1200} rows={3} value={brief.existingTools} onChange={(event) => updateBrief("existingTools", event.target.value)} placeholder={ru ? "Например: CRM, календарь, рассылка, аналитика. Если не знаете — оставьте пустым." : "For example: CRM, calendar, email, analytics. Leave blank if unsure."} />
          </label>
        </div>}
        {step === 6 && <div className="project-inquiry-details">
          <div className="project-select-grid">
            <label>{ru ? "Желаемый срок" : "Desired timeline"}<select required value={timeline} onChange={(event) => setTimeline(event.target.value as Timeline)}><option value="" disabled>{ru ? "Выберите" : "Choose"}</option>{Object.entries(timelines).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>{ru ? "Ориентир по бюджету" : "Budget range"}<select required value={budgetRange} onChange={(event) => setBudgetRange(event.target.value as Budget)}><option value="" disabled>{ru ? "Выберите" : "Choose"}</option>{Object.entries(budgets).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <p className="project-inquiry-hint">{ru ? "Это ориентир для предложения. Если не определились, выберите «Пока не знаю»." : "This is only a guide for the proposal. Choose “Not sure yet” if you have not decided."}</p>
        </div>}
        {step === 7 && <div className="project-inquiry-details">
          <label>{ru ? "Ваше имя" : "Your name"}<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
          <label>{ru ? "Электронная почта" : "Email address"}<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          <label className="project-inquiry-consent"><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{ru ? <>Согласен(на), чтобы G-lab использовал эти данные для ответа. <a href="/ru/privacy">Уведомление о данных</a>.</> : <>G-lab may use these details to reply to my request. <a href="/privacy">Privacy notice</a>.</>}</span></label>
        </div>}

        <div className="project-inquiry-actions">
          {step > 0 && <button type="button" className="project-inquiry-back" onClick={() => changeStep(step - 1)}>{ru ? "Назад" : "Back"}</button>}
          {step < 7 ? <button type="submit" className="project-inquiry-next" disabled={!stepValid}>{ru ? "Продолжить" : "Continue"}<span aria-hidden="true"><ArrowIcon /></span></button>
            : <button type="submit" className="project-inquiry-next" disabled={busy || !consent}>{busy ? (ru ? "Отправляем…" : "Sending…") : (ru ? "Отправить бриф" : "Send project brief")}<span aria-hidden="true"><ArrowIcon /></span></button>}
        </div>
        <p className="project-inquiry-status" role="status">{message}</p>
      </form>
    )}
    <p className="project-inquiry-foot">{ru ? "8 коротких шагов · Без оплаты и обязательств · Можно указать «пока не знаю»" : "8 short steps · No payment or commitment · “Not sure yet” is always an option"}</p>
  </section>;
}
