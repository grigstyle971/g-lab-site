import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { QuickInquiry } from "../components/QuickInquiry";
import { ArrowIcon } from "../components/ArrowIcon";
import { GlFooter, GlNav } from "../components/GlChrome";
import { portfolioProjects } from "../lib/portfolio-projects";
import { glFonts } from "./gl-fonts";

const path = "/websites-for-businesses";
export function businessWebsitesMetadata(ru: boolean): Metadata {
  const title = ru ? "Создание сайтов для бизнеса в любой отрасли" : "Web Design for Businesses in Any Industry";
  const openGraphTitle = `${title} | G-lab`;
  const description = ru
    ? "Создаём сайты для бизнеса в любой отрасли: услуги, товары, заявки и личные кабинеты. Посмотрите примеры, ориентиры стоимости и отправьте короткую заявку."
    : "Custom websites for businesses in any industry: clear service pages, products, enquiries and client portals. See our work, starting price ranges and send a project request.";
  return { title, description, alternates: { canonical: `${ru ? "/ru" : ""}${path}`, languages: { en: path, ru: `/ru${path}` } }, openGraph: { title: openGraphTitle, description, type: "website", images: ["/g-lab-social.jpg"] } };
}

export default function BusinessWebsitesPage({ ru = false }: { ru?: boolean }) {
  const prefix = ru ? "/ru" : "";
  const text = (en: string, russian: string) => ru ? russian : en;
  return <main className={`gl ${glFonts}`}>
    <GlNav ru={ru} current="services" />

    <section className="gl-page-hero gl-wrap gl-split">
      <div>
        <h1>{text("A website that makes ", "Сайт, который ведёт клиента ")}<i>{text("the next step clear.", "к следующему шагу.")}</i></h1>
        <p className="gl-lead">{text("Show what your business offers, give customers the information they need and make it easy to enquire, book or buy.", "Покажите, что предлагает ваш бизнес, дайте клиентам важную информацию и упростите заявку, запись или покупку.")}</p>
        <div className="gl-acts">
          <a className="gl-btn gl-btn--signal" href="#request">{text("Tell me about your website", "Обсудить ваш сайт")} <ArrowIcon /></a>
          <a className="gl-btn" href="#prices">{text("See price ranges", "Ориентиры стоимости")}</a>
        </div>
      </div>
      <Link className="gl-frame" href={`${prefix}/work#project-${portfolioProjects[0].id}`}>
        <span className="gl-bar"><i /><i /><i /><span>G-lab build / by.alinkins</span></span>
        <Image src={portfolioProjects[0].image} alt={portfolioProjects[0].imageAlt[ru ? "ru" : "en"]} width={1440} height={1000} priority sizes="(max-width: 850px) 100vw, 48vw" />
      </Link>
    </section>

    <section className="gl-sec gl-wrap">
      <h2 className="gl-h2">{text("Understand. Choose. Get in touch.", "Понять. Выбрать. Связаться.")}</h2>
      <p className="gl-sub">{text("What your visitors need from the site — and what we build it around.", "Что посетителю нужно от сайта — и вокруг чего мы его строим.")}</p>
      <ol className="gl-mods gl-mods--paper">{[
        [text("Explain your offer", "Понятное предложение"), text("Show what you sell or provide, who it helps and what customers can expect.", "Покажите, что вы предлагаете, кому это подходит и чего ожидать клиенту.")],
        [text("Show useful proof", "Покажите важное"), text("Present real work, product details, process information or answers that help visitors choose.", "Представьте реальные работы, детали продукта, процесс или ответы, которые помогут принять решение.")],
        [text("Make the next step easy", "Упростите следующий шаг"), text("Give visitors a clear way to ask, book or buy, based on the features agreed for the project.", "Предложите понятный способ задать вопрос, записаться или купить — в рамках согласованных функций сайта.")],
      ].map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
    </section>

    <section className="gl-sec gl-dark" id="examples">
      <div className="gl-wrap">
        <h2 className="gl-h2">{text("See the work before you enquire.", "Посмотрите работы до заявки.")}</h2>
        <p className="gl-sub">{text("These examples show different project types. We shape each website around the business, its customers and the next step it needs.", "Эти примеры показывают разные типы проектов. Каждый сайт проектируем с учётом бизнеса, его клиентов и нужного следующего шага.")}</p>
        <div className="gl-cases">{portfolioProjects.slice(0, 2).map(project => <article key={project.id}>
          <Link className="gl-frame" href={`${prefix}/work#project-${project.id}`}>
            <span className="gl-bar"><i /><i /><i /><span>{project.domainLabel}</span></span>
            <Image src={project.image} alt={project.imageAlt[ru ? "ru" : "en"]} width={1200} height={800} sizes="(max-width: 850px) 100vw, 45vw" />
          </Link>
          <h3>{project.name}</h3><p>{project.description[ru ? "ru" : "en"]}</p>
          <Link href={`${prefix}/work#project-${project.id}`} className="gl-more">{text("Explore the project", "Посмотреть проект")} <ArrowIcon /></Link>
        </article>)}</div>
      </div>
    </section>

    <section className="gl-sec gl-wrap" id="prices">
      <h2 className="gl-h2">{text("Start with the scope you need.", "Начните с нужного объёма.")}</h2>
      <p className="gl-sub">{text("Starting price ranges, USD.", "Базовые ориентиры стоимости, USD.")}</p>
      <div className="gl-prices">{[
        [text("Landing page", "Лендинг"), "$250–400", text("One page for one offer, product or service, with an enquiry form.", "Одна страница для предложения, товара или услуги с формой заявки.")],
        [text("Business website", "Сайт для бизнеса"), "$300–500", text("A basic website of up to five pages to present your work, products or services.", "Базовый сайт до пяти страниц для ваших работ, товаров или услуг.")],
        [text("Client portal", "Личный кабинет"), "$600–950", text("A basic signed-in area. Payments, course delivery and integrations are scoped separately.", "Базовый раздел с входом. Оплата, учебная платформа и интеграции оцениваются отдельно.")],
      ].map(([title, price, copy]) => <article key={title}><h3>{title}</h3><strong>{price}</strong><p>{copy}</p></article>)}</div>
      <p className="gl-note">{text("Preliminary base ranges, not a final quote. I’ll confirm the scope and fixed quote with you before work starts. Extra pages, languages, booking, payments and other integrations can increase the cost. Domain, hosting and paid services are separate.", "Предварительные базовые диапазоны, а не итоговая смета. До начала работ согласуем объём и фиксированную смету. Дополнительные страницы, языки, запись, оплата и другие интеграции могут увеличить стоимость. Домен, хостинг и платные сервисы оплачиваются отдельно.")}</p>
    </section>

    <section className="gl-sec gl-course">
      <div className="gl-wrap">
        <h2 className="gl-h2">{text("A clear path to launch.", "Понятный путь к запуску.")}</h2>
        <ol className="gl-mods">{[
          text("You describe the business and the result you need.", "Вы описываете бизнес и нужный результат."),
          text("We agree on the pages, features, materials, timing and quote.", "Согласуем страницы, функции, материалы, сроки и смету."),
          text("You review the design and working website before launch.", "Вы смотрите дизайн и работающий сайт перед запуском."),
          text("We launch the agreed version and hand over the project.", "Публикуем согласованную версию и передаём проект."),
        ].map((step, index) => <li key={step}><span>0{index + 1}</span><p className="gl-step-text">{step}</p></li>)}</ol>
      </div>
    </section>

    <section className="gl-sec gl-wrap gl-contact" id="request">
      <div>
        <h2 className="gl-h2">{text("Tell us about your website.", "Расскажите о вашем сайте.")}</h2>
        <p className="gl-sub">{text("Send the essentials. We can discuss pages, features and budget by email.", "Отправьте самое важное. Страницы, функции и бюджет обсудим по почте.")}</p>
        <a className="gl-mail" href="mailto:glab.tech.support@gmail.com">glab.tech.support@gmail.com</a>
        <p className="gl-note"><Link className="gl-more" href={`${prefix}/#contact`}>{text("Or complete a detailed project brief", "Или заполните подробный бриф")} <ArrowIcon /></Link></p>
      </div>
      <div className="gl-form"><QuickInquiry /></div>
    </section>

    <GlFooter ru={ru} />
  </main>;
}
