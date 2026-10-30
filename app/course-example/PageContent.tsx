"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "../../components/LanguageProvider";
import { ArrowIcon } from "../../components/ArrowIcon";
import "./course-example.css";

export default function CourseExamplePage() {
  const ru = useLocale() === "ru";
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const prefix = ru ? "/ru" : "";
  const samplePrompt = ru
    ? `Улучши существующий сайт услуги по этому разбору.\nПосетитель: родитель в Дананге, который выбирает семейного фотографа.\nЦель: помочь понять предложение и найти следующий шаг.\nСохрани: текущий проект, визуальное направление и рабочие ссылки.\nИзмени: уточни заголовок, объясни три этапа, ответь на вопросы о месте и подготовке, свяжи каждый пункт меню с нужным разделом.\nНе придумывай отзывы, квалификации, цены, реальные контакты или работающую форму. Отметь примерные сведения, которые нужно заменить.\nПроверь: открой предпросмотр, нажми каждую ссылку, посмотри страницу на узком экране телефона и проверь фокус клавиатуры. Сообщи, что проверить не удалось.`
    : `Improve my existing service website using this review.\nVisitor: a parent in Da Nang comparing family photo sessions.\nGoal: help them understand the offer and find the next step.\nKeep: the current project, visual direction and working links.\nChange: make the headline specific, explain the three-step process, answer location and preparation questions, and connect every navigation link to the right section.\nDo not invent customer reviews, qualifications, prices, real contact details or a working form. Mark any sample facts that still need replacing.\nCheck: open the preview, test every link, review a narrow phone-sized layout and keyboard focus. Report what you could not verify.`;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(samplePrompt);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <main className="course-example">
      <a className="ce-skip" href="#example-content">{ru ? "К основному содержанию" : "Skip to content"}</a>
      <header className="ce-header">
        <Link className="ce-brand" href={`${prefix}/courses/build-with-codex`}>G<span>-</span>lab</Link>
        <p>{ru ? "УЧЕБНЫЙ ПРИМЕР · КУРС CODEX" : "WORKED EXAMPLE · CODEX COURSE"}</p>
        <Link className="ce-header-link" href={`${prefix}/courses/build-with-codex`}>{ru ? "О курсе" : "Course overview"} <ArrowIcon /></Link>
      </header>

      <section className="ce-intro" id="example-content">
        <p className="ce-eyebrow">{ru ? "ОДИН ПРОЕКТ ОТ ЧЕРНОВИКА ДО ПРОВЕРКИ" : "ONE PROJECT FROM FIRST DRAFT TO REVIEW"}</p>
        <h1>{ru ? <>Как выглядит <em>полезный сайт</em></> : <>What a useful website <em>looks like</em></>}</h1>
        <p className="ce-intro-copy">{ru
          ? "Ниже — вымышленный сайт фотографа Анны и разбор решений за ним. Сначала увидите слабый черновик, затем готовую учебную версию, проверки и запрос для своего проекта."
          : "Below is a fictional photographer’s website and the reasoning behind it. Compare a weak first draft with a finished learning example, see what to check, then adapt the prompt for your own project."}</p>
        <p className="ce-fiction-note"><span aria-hidden="true">✳</span>{ru
          ? "Учебный сценарий: Анна, её бизнес и детали услуги вымышлены. Здесь нет реальных отзывов, клиентов или работающей формы связи."
          : "Practice scenario: Anna, her business and service details are fictional. There are no real reviews, clients or working contact form here."}</p>
      </section>

      <section className="ce-before" aria-labelledby="ce-before-title">
        <div className="ce-section-heading">
          <p className="ce-eyebrow">{ru ? "ШАГ 01 · НАЙТИ ПРОБЛЕМУ" : "STEP 01 · FIND THE PROBLEM"}</p>
          <h2 id="ce-before-title">{ru ? "Слабый черновик" : "The weak first draft"}</h2>
          <p>{ru ? "Он звучит красиво, но почти не помогает семье решить, подходит ли ей услуга." : "It sounds polished, but gives a family little help deciding whether the service fits."}</p>
        </div>
        <article className="ce-draft-card">
          <div className="ce-draft-label"><span>ANNA PHOTO</span><b>{ru ? "ЧЕРНОВИК" : "DRAFT"}</b></div>
          <p className="ce-draft-kicker">{ru ? "ЛУЧШИЕ МОМЕНТЫ" : "CAPTURING MOMENTS"}</p>
          <h3>{ru ? "Воспоминания, которые останутся навсегда" : "Memories that last forever"}</h3>
          <p>{ru ? "Мы создаём красивые фотографии для самых особенных моментов. Свяжитесь с нами и узнайте больше." : "We create beautiful photos for your most special moments. Get in touch to find out more."}</p>
          <span className="ce-dead-action">{ru ? "Нажмите здесь" : "Click here"}</span>
          <div className="ce-placeholder-review">★★★★★ &nbsp; “{ru ? "Добавьте отзыв клиента" : "Add a customer review"}”</div>
        </article>
        <div className="ce-issues">
          <article><span>01</span><div><h3>{ru ? "Неясно, для кого услуга" : "The audience is unclear"}</h3><p>{ru ? "«Особенные моменты» подходят почти любой фотосъёмке. Родитель не узнаёт здесь свою задачу." : "“Special moments” could describe almost any photo service. A parent cannot tell if this fits their family."}</p></div></article>
          <article><span>02</span><div><h3>{ru ? "Нет конкретики и следующего шага" : "No useful detail or next step"}</h3><p>{ru ? "Не указаны место, формат съёмки и то, что произойдёт после нажатия на кнопку." : "The location and session format are missing, and the button has no destination."}</p></div></article>
          <article><span>03</span><div><h3>{ru ? "Заглушка выглядит как доказательство" : "A placeholder looks like proof"}</h3><p>{ru ? "Текст «добавьте отзыв» нельзя выдавать за реальный отзыв. Удалите блок, пока нет настоящего отзыва и разрешения на публикацию." : "“Add a customer review” must never pass as a real testimonial. Remove it until a genuine review and permission to publish it exist."}</p></div></article>
        </div>
      </section>

      <section className="ce-demo-wrap" aria-labelledby="ce-demo-title">
        <div className="ce-section-heading ce-demo-heading">
          <p className="ce-eyebrow">{ru ? "ШАГ 02 · РЕЗУЛЬТАТ" : "STEP 02 · THE RESULT"}</p>
          <h2 id="ce-demo-title">{ru ? "Та же услуга. Понятнее путь." : "Same service. A clearer path."}</h2>
          <p>{ru ? "Это адаптивный макет, собранный вокруг вопросов посетителя. Ссылки в меню и кнопка работают внутри страницы." : "This responsive page is organised around visitor questions. The navigation and button work within the page."}</p>
        </div>
        <article className="ce-site" aria-label={ru ? "Вымышленный сайт фотографа Анны" : "Fictional photographer Anna’s website"}>
          <div className="ce-site-bar"><span>ANNA <i>PHOTO STORIES</i></span><nav aria-label={ru ? "Навигация примера" : "Example navigation"}><a href="#ce-process">{ru ? "КАК ЭТО РАБОТАЕТ" : "THE PROCESS"}</a><a href="#ce-faq">FAQ</a><a href="#ce-contact">{ru ? "СВЯЗЬ" : "CONTACT"}</a></nav></div>
          <div className="ce-site-hero">
            <p>{ru ? "УЧЕБНЫЙ ПРИМЕР · ФОТОСЪЁМКА СЕМЬИ · ДАНАНГ" : "FICTIONAL PRACTICE SITE · FAMILY PHOTOGRAPHY · DA NANG"}</p>
            <h3>{ru ? <>Семейные фотографии,<br/><em>похожие на вашу жизнь.</em></> : <>Family photographs<br/><em>that feel like your life.</em></>}</h3>
            <div className="ce-site-bottom"><p>{ru ? "Спокойная съёмка дома или у моря — для семьи, которой важнее быть собой, чем позировать." : "Unhurried sessions at home or by the sea, for families who would rather be themselves than pose."}</p><a href="#ce-process">{ru ? "Посмотреть, как проходит съёмка" : "See how a session works"} <ArrowIcon /></a></div>
            <span className="ce-site-index">01 / 04</span>
          </div>
          <section className="ce-gallery" aria-label={ru ? "Декоративные блоки под будущие фотографии" : "Decorative placeholders for future photographs"}>
            <div className="ce-photo ce-photo-one"><span>{ru ? "ФОТО 01 · ДОБАВИТЬ СВОЁ ИЗОБРАЖЕНИЕ" : "PHOTO 01 · ADD AN IMAGE YOU CAN USE"}</span></div>
            <div className="ce-photo ce-photo-two"><span>{ru ? "ФОТО 02 · ДОБАВИТЬ СВОЁ ИЗОБРАЖЕНИЕ" : "PHOTO 02 · ADD AN IMAGE YOU CAN USE"}</span></div>
            <div className="ce-gallery-note"><b>12:40</b><span>{ru ? "ПРИМЕР СТРАНИЦЫ · ИЗОБРАЖЕНИЯ НЕ ПОДМЕНЕНЫ ЧУЖИМИ ФОТО" : "LAYOUT EXAMPLE · NO BORROWED PHOTOS"}</span></div>
          </section>
          <div className="ce-site-copy">
            <section id="ce-process"><p className="ce-mini-label">{ru ? "ПРОСТО И СПОКОЙНО" : "SIMPLE AND UNHURRIED"}</p><h4>{ru ? "Как всё проходит" : "What to expect"}</h4><div className="ce-process-grid"><article><b>01</b><h5>{ru ? "Обсудим" : "We talk"}</h5><p>{ru ? "Вы расскажете, кто будет на съёмке и какой день вам удобен." : "Tell me who will join and what kind of day feels right for your family."}</p></article><article><b>02</b><h5>{ru ? "Подготовимся" : "We prepare"}</h5><p>{ru ? "Выберем дом или место у моря и договоримся о простых деталях." : "Choose home or a beach location and agree on the practical details."}</p></article><article><b>03</b><h5>{ru ? "Встретимся" : "We meet"}</h5><p>{ru ? "На съёмке можно двигаться, разговаривать и делать паузы." : "During the session, you can move around, talk and take breaks."}</p></article></div></section>
            <section className="ce-faq" id="ce-faq"><p className="ce-mini-label">{ru ? "ПЕРЕД ВСТРЕЧЕЙ" : "BEFORE WE MEET"}</p><h4>{ru ? "Что стоит знать" : "A few useful details"}</h4><details><summary>{ru ? "Где проходит съёмка?" : "Where do sessions happen?"}</summary><p>{ru ? "Учебный пример предлагает дом или пляж в Дананге. В настоящем проекте укажите только доступные и согласованные места." : "This example offers home or beach sessions in Da Nang. A real site should list only locations that are actually available and agreed."}</p></details><details><summary>{ru ? "Нужно ли уметь позировать?" : "Do we need to know how to pose?"}</summary><p>{ru ? "Нет. Эта вымышленная услуга строится вокруг естественного общения; настоящие обещания нужно сверить с фотографом." : "No. This fictional offer is built around natural interaction; confirm real service promises with the photographer."}</p></details></section>
            <section className="ce-contact" id="ce-contact"><div><p className="ce-mini-label">{ru ? "ЧЕСТНОЕ СОСТОЯНИЕ ДЕМО" : "DEMO STATUS"}</p><h4>{ru ? "Контакт пока не подключён" : "Contact is not connected yet"}</h4><p>{ru ? "Здесь намеренно нет фальшивой формы. В реальном проекте добавьте проверенный email или сервис записи и отправьте тестовый запрос сами." : "There is deliberately no pretend form here. For a real project, add a verified email or booking service and send a test enquiry yourself."}</p></div><a href="#ce-review">{ru ? "Как проверить страницу" : "How to review this page"} <ArrowIcon /></a></section>
          </div>
        </article>
      </section>

      <section className="ce-review" id="ce-review" aria-labelledby="ce-review-title">
        <div className="ce-section-heading"><p className="ce-eyebrow">{ru ? "ШАГ 03 · ПРОВЕРКА" : "STEP 03 · REVIEW"}</p><h2 id="ce-review-title">{ru ? "Почему эта версия лучше" : "Why this version works better"}</h2><p>{ru ? "Каждое изменение связано с вопросом посетителя или проверяемым поведением страницы." : "Each change answers a visitor question or fixes a behaviour you can verify."}</p></div>
        <div className="ce-review-list">
          <article><span>01</span><div><h3>{ru ? "Посетитель узнаёт свою ситуацию" : "The visitor recognises their situation"}</h3><p>{ru ? "Заголовок называет семейную съёмку, а подзаголовок — формат и место." : "The headline names family photography, and the supporting line gives its format and location."}</p><small>{ru ? "Проверка: попросите человека за пять секунд описать услугу и для кого она." : "Check: ask someone to describe the service and audience after five seconds."}</small></div></article>
          <article><span>02</span><div><h3>{ru ? "Понятно, что будет дальше" : "The next step is clear"}</h3><p>{ru ? "Главная кнопка ведёт к процессу, а меню — к существующим разделам страницы." : "The main button leads to the process, and each navigation link reaches a real section."}</p><small>{ru ? "Проверка: нажмите каждую ссылку мышью, затем с клавиатуры — Tab для выбора, Enter для перехода." : "Check: click every link, then use the keyboard — Tab to focus a link, Enter to follow it."}</small></div></article>
          <article><span>03</span><div><h3>{ru ? "Нет выдуманных обещаний" : "The page avoids made-up claims"}</h3><p>{ru ? "В примере нет оценок, наград, цен, реальных контактов или обещания отправить заявку." : "The example has no ratings, awards, prices, real contacts or claim that an enquiry was sent."}</p><small>{ru ? "Проверка: пометьте каждую цифру, отзыв и конкретное обещание; подтвердите или уберите." : "Check: mark every number, review and specific promise; verify it or remove it."}</small></div></article>
          <article><span>04</span><div><h3>{ru ? "Макет подстраивается под ширину" : "The layout adapts to the screen"}</h3><p>{ru ? "Сетка изображений, этапы и текст перестраиваются на узком экране без горизонтальной прокрутки." : "The image layout, steps and text reflow on a narrow screen without horizontal scrolling."}</p><small>{ru ? "Проверка: откройте предпросмотр примерно на ширине телефона и пройдите страницу сверху вниз." : "Check: use a phone-sized preview and scroll through the page from top to bottom."}</small></div></article>
        </div>
      </section>

      <section className="ce-prompt-section" aria-labelledby="ce-prompt-title">
        <div><p className="ce-eyebrow">{ru ? "ЗАПРОС ДЛЯ CODEX" : "A CODEX REQUEST"}</p><h2 id="ce-prompt-title">{ru ? "Возьмите метод в свой проект" : "Use the method on your project"}</h2><p>{ru ? "Замените аудиторию, цель и детали на свои. Сначала попросите объяснить план, затем проверьте итог сами." : "Replace the audience, goal and details with your own. Ask for a plan first, then verify the result yourself."}</p></div>
        <div className="ce-prompt-card"><pre>{samplePrompt}</pre><button type="button" onClick={copyPrompt}>{copyState === "copied" ? (ru ? "Скопировано ✓" : "Copied ✓") : (ru ? "Скопировать запрос" : "Copy prompt")}</button><span role="status" aria-live="polite">{copyState === "copied" ? (ru ? "Запрос скопирован." : "Prompt copied.") : copyState === "error" ? (ru ? "Буфер обмена недоступен — выделите и скопируйте текст вручную." : "Clipboard access is unavailable. Select and copy the text manually.") : ""}</span></div>
      </section>

      <section className="ce-your-turn" aria-labelledby="ce-your-turn-title">
        <p className="ce-eyebrow">{ru ? "ВАША ПРАКТИКА · 20–30 МИНУТ" : "YOUR PRACTICE · 20–30 MINUTES"}</p>
        <h2 id="ce-your-turn-title">{ru ? "Проверьте свой сайт по тем же правилам" : "Review your own site with the same rules"}</h2>
        <ol>{(ru ? ["Кто именно придёт на страницу и что ему нужно понять?", "Какое одно действие вы хотите, чтобы посетитель сделал?", "Проверьте меню и кнопку. Куда они ведут на самом деле?", "Откройте узкий экран. Читается ли страница без увеличения и горизонтальной прокрутки?", "Есть ли отзыв, цифра, форма или обещание, которое ещё не подтверждено?", "Запишите один факт: что проверили, что увидели, что исправите следующим шагом."] : ["Who exactly will visit this page, and what do they need to understand?", "What is the one action you want the visitor to take?", "Test the navigation and button. Where do they actually lead?", "Open a narrow screen. Can you read the page without zooming or horizontal scrolling?", "Is there a review, number, form or promise you have not verified?", "Record one fact: what you checked, what you observed and what you will improve next."]).map((item, index) => <li key={index}><span>0{index + 1}</span>{item}</li>)}</ol>
        <div className="ce-next-links"><Link href={`${prefix}/course-checkout`}>{ru ? "Получить доступ к курсу" : "Get course access"} <ArrowIcon /></Link><Link href={`${prefix}/courses/build-with-codex`}>{ru ? "Вернуться к программе курса" : "Back to the course outline"} <ArrowIcon /></Link></div>
      </section>
      <footer className="ce-footer"><span>G-lab · {ru ? "Практический курс" : "Practical course"}</span><a href="mailto:glab.tech.support@gmail.com">glab.tech.support@gmail.com</a></footer>
    </main>
  );
}
