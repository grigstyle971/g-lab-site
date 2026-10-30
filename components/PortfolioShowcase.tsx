"use client";

import { useState } from "react";
import Image from "next/image";
import { Localize, useLocale } from "./LanguageProvider";
import { ArrowIcon } from "./ArrowIcon";
import { portfolioProjects } from "../lib/portfolio-projects";

const features = [
  {
    title: "Website",
    tag: "PUBLIC WEBSITE",
    text: "A branded storefront introduces the creator, explains the programs and guides visitors to the right product.",
    steps: ["Discover the creator", "Choose a program", "View the details"],
  },
  {
    title: "Payments & access",
    tag: "PAYMENT → ACCESS",
    text: "Stripe checkout connects the purchase to the program. A confirmed payment grants access in the customer account.",
    steps: ["Choose a program", "Pay with Stripe", "Receive program access"],
  },
  {
    title: "Personal accounts",
    tag: "SUPABASE / CLIENT AREA",
    text: "Customers sign in to their own space and return to the programs they have purchased. Account access and purchases are connected.",
    steps: ["Sign in", "My programs", "Open purchased content"],
  },
  {
    title: "Learning platform",
    tag: "PROTECTED CONTENT",
    text: "Programs contain structured lessons, video and documents. Access checks protect paid content; PDF pages can include a personal watermark.",
    steps: ["Open a program", "Choose a lesson", "Watch and practise"],
  },
  {
    title: "Admin tools",
    tag: "CONTENT MANAGEMENT",
    text: "The owner can manage courses, sections, lessons, content blocks and customer access from a dedicated administration area.",
    steps: ["Manage the course", "Update its lessons", "Manage access"],
  },
  {
    title: "Mobile app experience",
    tag: "INSTALLABLE PWA",
    text: "The website can be added to the phone home screen, giving customers a direct route back to their programs.",
    steps: ["Open on a phone", "Add to home screen", "Return to your programs"],
  },
];
const tabTitlesRu = ["Сайт", "Оплата и доступ", "Личный кабинет", "Обучение", "Инструменты автора", "Мобильное приложение"];
const panelTitlesRu = ["Сайт для клиентов", "Оплата и доступ", "Личный кабинет", "Платформа обучения", "Инструменты автора", "Для телефона"];

const local = (copy: { en: string; ru: string }, ru: boolean) => ru ? copy.ru : copy.en;

export function PortfolioShowcase() {
  const [selected, setSelected] = useState(0);
  const feature = features[selected];
  const first = portfolioProjects[0];
  const ru = useLocale() === "ru";
  const prefix = ru ? "/ru" : "";

  return (
    <Localize><div className="gl-portfolio">
      <header className="gl-page-hero gl-wrap">
        <h1>{ru ? <>Примеры работ.<br /><i>Сайты для реальных задач.</i></> : <>Selected work.<br /><i>Websites that do useful things.</i></>}</h1>
        <p className="gl-lead">{ru
          ? "Сайты и цифровые продукты, созданные под разные реальные задачи. Посмотрите, что было важно в каждом проекте — и откройте живой сайт."
          : "Websites and digital products built around real needs. See what mattered in each project — then open the live site."}</p>
      </header>

      <section className="gl-sec gl-dark" id={`project-${first.id}`}>
        <div className="gl-wrap">
          <header className="gl-flagship-head">
            <div>
              <p className="gl-tag">{local(first.category, ru)}</p>
              <h2 className="gl-h2">{first.name}</h2>
              <p className="gl-sub">{local(first.description, ru)}</p>
            </div>
            <a className="gl-btn gl-btn--paper" href={first.url} target="_blank" rel="noopener noreferrer">{ru ? "Открыть сайт" : "Visit website"} <ArrowIcon /></a>
          </header>

          <div className="gl-tabs" role="tablist" aria-label={ru ? "Возможности платформы" : "Explore platform features"}>
            {features.map((item, index) => (
              <button
                key={item.title}
                type="button"
                id={`feature-tab-${index}`}
                role="tab"
                aria-selected={selected === index}
                aria-controls="portfolio-feature"
                tabIndex={selected === index ? 0 : -1}
                onKeyDown={(event) => {
                  let next = index;
                  if (event.key === "ArrowRight") next = (index + 1) % features.length;
                  else if (event.key === "ArrowLeft") next = (index + features.length - 1) % features.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = features.length - 1;
                  else return;
                  event.preventDefault();
                  setSelected(next);
                  document.getElementById(`feature-tab-${next}`)?.focus();
                }}
                onClick={() => setSelected(index)}
              >
                {local({ en: item.title, ru: tabTitlesRu[index] }, ru)}
              </button>
            ))}
          </div>

          <div className="gl-feature" role="tabpanel" id="portfolio-feature" aria-labelledby={`feature-tab-${selected}`}>
            {selected === 0 ? (
              <a className="gl-frame" href={first.url} target="_blank" rel="noopener noreferrer" aria-label={ru ? "Открыть by-alinkins.com в новой вкладке" : "Open by-alinkins.com in a new tab"}>
                <span className="gl-bar"><i /><i /><i /><span>{first.domainLabel}</span></span>
                <Image src={first.image} width={1440} height={1000} sizes="(max-width: 760px) calc(100vw - 40px), 56vw" alt={local(first.imageAlt, ru)} loading="eager" />
              </a>
            ) : (
              <div className="gl-frame gl-flow">
                <span className="gl-bar"><i /><i /><i /><span>{first.name} · {feature.tag}</span></span>
                <ol>{feature.steps.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol>
                <small>{ru ? "Схема функции" : "Feature diagram"}</small>
              </div>
            )}
            <div className="gl-feature-copy" aria-live="polite">
              <p className="gl-tag">{feature.tag}</p>
              <h3>{local({ en: feature.title, ru: panelTitlesRu[selected] }, ru)}</h3>
              <p>{feature.text}</p>
            </div>
          </div>
          <p className="gl-chips"><span>Stripe</span><span>Supabase</span><span>Video &amp; documents</span><span>Admin panel</span><span>PWA</span></p>
        </div>
      </section>

      <section className="gl-sec gl-wrap" aria-label={ru ? "Ещё проекты" : "More projects"}>
        {portfolioProjects.slice(1).map((project) => (
          <article key={project.id} id={`project-${project.id}`} className="gl-project">
            <a className="gl-frame" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={ru ? `Открыть ${project.domainLabel} в новой вкладке` : `Open ${project.domainLabel} in a new tab`}>
              <span className="gl-bar"><i /><i /><i /><span>{project.domainLabel}</span></span>
              <Image src={project.image} width={1440} height={1000} sizes="(max-width: 760px) calc(100vw - 40px), 50vw" alt={local(project.imageAlt, ru)} loading="lazy" />
            </a>
            <div>
              <p className="gl-tag">{local(project.category, ru)}</p>
              <h2 className="gl-h2">{project.name}</h2>
              <p className="gl-sub">{local(project.description, ru)}</p>
              <ul className="gl-highlights">{project.highlights.map((highlight) => (
                <li key={highlight.title.en}><strong>{local(highlight.title, ru)}</strong><span>{local(highlight.description, ru)}</span></li>
              ))}</ul>
              <a className="gl-btn" href={project.url} target="_blank" rel="noopener noreferrer">{ru ? "Открыть проект" : "Explore this project"} <ArrowIcon /></a>
            </div>
          </article>
        ))}
      </section>

      <section className="gl-sec gl-course gl-final">
        <div className="gl-wrap">
          <h2 className="gl-h2">{ru ? "Есть идея для сайта?" : "Have an idea for a website?"}</h2>
          <p className="gl-sub">{ru ? "Расскажите о ней в паре строк — ответим на почту с первыми мыслями." : "Tell us about it in a couple of lines — we’ll reply by email with first thoughts."}</p>
          <a className="gl-btn gl-btn--ink" href={`${prefix}/#contact`}>{ru ? "Обсудить проект" : "Discuss my website"} <ArrowIcon /></a>
        </div>
      </section>
    </div></Localize>
  );
}
