"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MotionConfig, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale } from "../components/LanguageProvider";
import { ArrowIcon } from "../components/ArrowIcon";
import { CourseBuyButton } from "../components/CourseBuyButton";
import { ProjectInquiry } from "../components/ProjectInquiry";
import { QuickInquiry } from "../components/QuickInquiry";
import { GlFooter, GlNav } from "../components/GlChrome";

type Text = [en: string, ru: string];

// The live sketch: every business name gets its own palette and tagline.
const looks: { bg: string; ink: string; accent: string; photo: string; tagline: Text; cta: Text }[] = [
  { bg: "#2F2219", ink: "#F6E7D2", accent: "#F2A65A", photo: "linear-gradient(135deg,#8A5A3B,#D9A066)", tagline: ["Worth getting up early for.", "Ради этого стоит встать пораньше."], cta: ["Book a table", "Забронировать стол"] },
  { bg: "#14304A", ink: "#E8F1F8", accent: "#7FD1C7", photo: "linear-gradient(135deg,#1F5F7A,#9ED6D0)", tagline: ["Everything you need, in one place.", "Всё, что нужно, — в одном месте."], cta: ["See the services", "Посмотреть услуги"] },
  { bg: "#F4E9DD", ink: "#2A1E1A", accent: "#A8402B", photo: "linear-gradient(135deg,#E7B89A,#C8553D)", tagline: ["Made by hand, made to last.", "Сделано руками. Сделано на годы."], cta: ["Order now", "Заказать"] },
  { bg: "#1B1B1F", ink: "#F2F2F2", accent: "#C6F35E", photo: "linear-gradient(135deg,#3A3A44,#C6F35E)", tagline: ["Book online in a minute.", "Запишитесь онлайн за минуту."], cta: ["Book a session", "Записаться"] },
];

const translit: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya" };
const slug = (name: string) => name.toLowerCase().split("").map((c) => translit[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "your-business";
const lookFor = (name: string) => looks[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % looks.length];

const steps: [Text, Text][] = [
  [["Idea", "Идея"], ["We work out who your clients are and what they should do on the site.", "Разбираемся, кто ваши клиенты и что они должны сделать на сайте."]],
  [["Wireframe", "Каркас"], ["We lay out the pages and blocks: what goes where, and why.", "Раскладываем страницы и блоки: что, где и зачем."]],
  [["Design", "Дизайн"], ["Colour, type and photos — your style, not a template.", "Цвет, шрифты, фотографии — ваш стиль, а не шаблон."]],
  [["Launch", "Запуск"], ["We test it on phones and laptops, then publish it.", "Проверяем на телефоне и компьютере и публикуем."]],
];

const works: { img: string; name: string; tag: Text }[] = [
  { img: "/portfolio/alinkins-programs.png", name: "by-alinkins.com", tag: ["Workout programs & checkout", "Программы тренировок и оплата"] },
  { img: "/portfolio/media.png", name: "by-alinkins.space", tag: ["Media website", "Медиа-сайт"] },
  { img: "/portfolio/glab-current.png", name: "g-lab.agency", tag: ["Studio & course", "Студия и курс"] },
];

const services: [Text, Text][] = [
  [["Business website", "Сайт для бизнеса"], ["A landing page or a full site that explains your service clearly and turns visitors into enquiries.", "Лендинг или многостраничный сайт, который понятно объясняет вашу услугу и приводит заявки."]],
  [["Client portal", "Личный кабинет"], ["A place where clients sign in, find their materials and follow their requests.", "Место, где клиенты входят в аккаунт, находят свои материалы и следят за заявками."]],
  [["AI automation", "Автоматизация с ИИ"], ["We find the tasks you repeat every day and hand them over to AI.", "Найдём задачи, которые вы повторяете каждый день, и переложим их на ИИ."]],
];

const modules: [string, Text, Text][] = [
  ["Codex", ["Build the site", "Собираем сайт"], ["Your first page, from your own description.", "Первая страница по вашему описанию."]],
  ["GitHub", ["Save the project", "Сохраняем проект"], ["An online copy and a history of every change.", "Копия в интернете и история изменений."]],
  ["Vercel", ["Publish", "Публикуем"], ["The site opens for everyone, by link.", "Сайт открывается по ссылке у всех."]],
  ["Supabase", ["Add accounts", "Добавляем аккаунты"], ["Sign-in, a client area and real data.", "Вход, личный кабинет и данные."]],
];

const stack = ["Codex", "Next.js", "GitHub", "Vercel", "Supabase"];

const rise = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -10% 0px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
} as const;

// One mini-site drawn in four states; the stage attribute switches between them in CSS.
function Sketch({ name, ru, stage }: { name: string; ru: boolean; stage: number }) {
  const look = lookFor(name);
  const style = { "--s-bg": look.bg, "--s-ink": look.ink, "--s-accent": look.accent, "--s-photo": look.photo } as React.CSSProperties;
  return (
    <div className="gl-browser" data-stage={stage} style={style}>
      <div className="gl-bar"><i /><i /><i /><span>{slug(name)}.{ru ? "ru" : "com"}</span>{stage === 3 && <b>{ru ? "опубликовано" : "live"}</b>}</div>
      <div className="gl-site">
        <p className="gl-idea" aria-hidden={stage !== 0}>{ru ? `«${name}»: кто приходит, зачем и что должен сделать на сайте?` : `“${name}”: who visits, why, and what should they do on the site?`}</p>
        <span className="gl-el gl-logo" data-label={ru ? "логотип" : "logo"}>{name}</span>
        <span className="gl-el gl-h" data-label="h1 · 48px">{ru ? look.tagline[1] : look.tagline[0]}</span>
        <span className="gl-el gl-p" data-label={ru ? "текст" : "text"}>{ru ? "Коротко о главном: что вы делаете и почему к вам стоит прийти." : "The short version: what you do and why people should come to you."}</span>
        <span className="gl-el gl-cta" data-label={ru ? "кнопка" : "button"}>{ru ? look.cta[1] : look.cta[0]}</span>
        <span className="gl-el gl-photo" data-label={ru ? "фото · 16:9" : "photo · 16:9"} />
      </div>
    </div>
  );
}

// Until the visitor types, the hero types example businesses and rebuilds the sketch for each one.
function useDemo(names: string[], paused: boolean) {
  const [text, setText] = useState(names[0]);
  const [stage, setStage] = useState(3);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setStage(3); return; }
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    let i = names.indexOf(text);
    const play = () => {
      timers.length = 0; // earlier timers have all fired by now
      i = (i + 1) % names.length;
      const word = names[i];
      setStage(1);
      [...word].forEach((_, k) => at(k * 55, () => setText(word.slice(0, k + 1))));
      const typedMs = word.length * 55;
      at(typedMs + 350, () => setStage(2));
      at(typedMs + 1100, () => setStage(3));
      at(typedMs + 4200, play);
    };
    at(2600, play);
    return () => timers.forEach(clearTimeout);
  }, [paused, names]); // `text` is read once on purpose: restart only when pausing or switching language
  return { text, stage };
}

export default function Home({ checkoutAvailable = false, fontClass = "" }: { checkoutAvailable?: boolean; fontClass?: string }) {
  const ru = useLocale() === "ru";
  const prefix = ru ? "/ru" : "";
  const t = ([en, r]: Text) => (ru ? r : en);
  const fallbackName = ru ? "Кофейня «Утро»" : "Morning Coffee";
  const demoNames = useMemo(() => ru ? [fallbackName, "Барбершоп Север", "Студия йоги «Лотос»", "Пекарня на углу"] : [fallbackName, "North Barbers", "Lotus Yoga Studio", "Corner Bakery"], [ru, fallbackName]);
  const [typed, setTyped] = useState("");
  const [focused, setFocused] = useState(false);
  const demo = useDemo(demoNames, focused || typed !== "");
  const name = typed.trim() || fallbackName;
  const heroName = typed.trim() || demo.text;

  // The pinned scene advances one build stage per quarter of its scroll.
  const processRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: processRef, offset: ["start start", "end end"] });
  const [stage, setStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStage(Math.min(3, Math.floor(v * 4))));

  return (
    <MotionConfig reducedMotion="user">
      <main className={`gl ${fontClass}`}>
        <GlNav ru={ru} />

        <section className="gl-hero gl-wrap" id="top">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              {ru ? <>Из идеи —<br />в&nbsp;<i>работающий</i><br />сайт.</> : <>From idea<br />to a&nbsp;<i>working</i><br />website.</>}
            </motion.h1>
            <p className="gl-lead">
              <b>{ru ? "G-lab делает сайты для бизнеса под ключ" : "G-lab builds websites for businesses, start to finish"}</b>
              {ru ? " — от первого наброска до запуска. А если хотите сами, научим собрать свой сайт за 16 практических уроков." : " — from the first sketch to launch. Prefer to do it yourself? Learn to build your own in 16 practical lessons."}
            </p>
            <div className="gl-acts">
              <a className="gl-btn gl-btn--signal" href="#contact">{ru ? "Заказать сайт" : "Order a website"} <ArrowIcon /></a>
              <a className="gl-btn" href="#course">{ru ? "Курс за $19" : "The $19 course"}</a>
            </div>
          </div>
          <motion.div className="gl-live" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}>
            <label htmlFor="gl-name">{ru ? "Как называется ваш бизнес?" : "What’s your business called?"}</label>
            <div className="gl-field">
              <input id="gl-name" value={typed} onChange={(e) => setTyped(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={demo.text} maxLength={40} autoComplete="off" spellCheck={false} />
              <small>{ru ? "набросок ↓" : "sketch ↓"}</small>
            </div>
            <Sketch name={heroName} ru={ru} stage={typed ? 3 : demo.stage} />
            <p className="gl-caption">{ru ? "Это набросок за секунду. Настоящий сайт продумаем вместе — под ваших клиентов." : "That’s a one-second sketch. The real site we design together — around your clients."}</p>
          </motion.div>
        </section>

        <section ref={processRef} className="gl-process" aria-labelledby="gl-process-title">
          <div className="gl-process-stage gl-wrap">
            <div className="gl-process-copy">
              <h2 id="gl-process-title" className="gl-h2">{ru ? "Как собирается сайт" : "How a site comes together"}</h2>
              <ol className="gl-steps">
                {steps.map(([title, text], i) => (
                  <li key={i} data-active={i === stage} data-done={i < stage}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <div><h3>{t(title)}</h3><p>{t(text)}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <Sketch name={name} ru={ru} stage={stage} />
          </div>
        </section>

        <section className="gl-sec gl-dark" id="work">
          <div className="gl-wrap">
            <motion.h2 className="gl-h2" {...rise}>{ru ? "Сайты, которые уже работают" : "Sites that are already working"}</motion.h2>
            <motion.p className="gl-sub" {...rise}>{ru ? "Живые проекты — откройте и проверьте сами." : "Live projects — open them and see for yourself."}</motion.p>
            <div className="gl-works">
              {works.map((w, i) => (
                <motion.a key={w.name} className="gl-work" href={`https://${w.name}/`} target="_blank" rel="noopener noreferrer"
                  initial={{ clipPath: "inset(18% 6% 0% 6% round 14px)", opacity: 0 }} whileInView={{ clipPath: "inset(0% 0% 0% 0% round 14px)", opacity: 1 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="gl-shot"><Image src={w.img} alt={`${w.name} — ${ru ? "главная страница" : "home page"}`} fill sizes={i === 0 ? "92vw" : "(max-width: 760px) 92vw, 46vw"} /></div>
                  <span className="gl-work-cap"><b>{w.name}</b><span>{t(w.tag)}</span></span>
                </motion.a>
              ))}
            </div>
            <Link className="gl-btn gl-btn--paper" href={`${prefix}/work`}>{ru ? "Все работы" : "All work"} <ArrowIcon /></Link>
          </div>
        </section>

        <section className="gl-sec gl-wrap" id="services">
          <motion.h2 className="gl-h2" {...rise}>{ru ? "Что сделаем для вас" : "What we’ll build for you"}</motion.h2>
          <div className="gl-rows">
            {services.map(([title, text]) => (
              <motion.a key={title[0]} className="gl-row" href="#contact" {...rise}>
                <h3>{t(title)}</h3><p>{t(text)}</p><span className="gl-arrow" aria-hidden="true"><ArrowIcon /></span>
              </motion.a>
            ))}
          </div>
          <Link className="gl-more" href={`${prefix}/websites-for-businesses`}>{ru ? "Сайты для бизнеса в любой отрасли" : "Websites for any kind of business"} <ArrowIcon /></Link>
        </section>

        <section className="gl-sec gl-course" id="course">
          <div className="gl-wrap">
            <div className="gl-course-grid">
              <motion.div {...rise}>
                <h2 className="gl-h2">{ru ? "Хотите собрать сайт сами?" : "Want to build it yourself?"}</h2>
                <p className="gl-sub">{ru ? "Курс для тех, кто никогда не программировал. Вы описываете результат — Codex пишет код, а вы проверяете и запускаете. После каждого урока — готовый шаг вашего сайта." : "A course for people who have never coded. You describe the result, Codex writes the code, you check it and ship it. Every lesson ends with a finished step of your site."}</p>
              </motion.div>
              <motion.div {...rise}>
                <p className="gl-price">$19</p>
                <p className="gl-facts"><span>{ru ? "16 уроков" : "16 lessons"}</span><span>{ru ? "4 модуля" : "4 modules"}</span><span>{ru ? "оплата один раз" : "pay once"}</span></p>
                <div className="gl-acts">
                  <CourseBuyButton available={checkoutAvailable} />
                  <a className="gl-btn" href={`${prefix}/courses/build-with-codex`}>{ru ? "Программа курса" : "See the curriculum"}</a>
                </div>
                <p className="gl-req">{ru ? "Нужны компьютер с Windows или Mac и доступ к Codex в ChatGPT." : "Requires a Windows or Mac computer, the ChatGPT desktop app and Codex access."}</p>
              </motion.div>
            </div>
            <ol className="gl-mods">
              {modules.map(([tool, title, text], i) => (
                <motion.li key={tool} {...rise} transition={{ ...rise.transition, delay: i * 0.08 }}>
                  <span>{String(i + 1).padStart(2, "0")} · {tool}</span><h3>{t(title)}</h3><p>{t(text)}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        <div className="gl-wrap">
          <div className="gl-tools">
            <small>{ru ? "Собираем на" : "Built with"}</small>
            <p className="gl-marquee" aria-label={stack.join(", ")}>
              {/* Two copies so the CSS loop can slide by exactly half its width. */}
              <span aria-hidden="true">{[...stack, ...stack].map((s, i) => <b key={i}>{s}</b>)}</span>
            </p>
          </div>
        </div>

        <section className="gl-sec gl-wrap gl-contact" id="contact">
          <motion.div {...rise}>
            <h2 className="gl-h2">{ru ? "Расскажите идею. Остальное — наша работа." : "Tell us the idea. The rest is our job."}</h2>
            <p className="gl-sub">{ru ? "Пара строк о вашем бизнесе — и мы ответим на почту с первыми мыслями." : "A couple of lines about your business, and we’ll reply by email with first thoughts."}</p>
            <a className="gl-mail" href="mailto:glab.tech.support@gmail.com">glab.tech.support@gmail.com</a>
          </motion.div>
          <div className="gl-form">
            <QuickInquiry />
            <details className="full-brief"><summary>{ru ? "Готовы рассказать подробнее? Заполните бриф" : "Ready to share more? Fill in the project brief"}</summary><ProjectInquiry /></details>
          </div>
        </section>

        <GlFooter ru={ru} />
      </main>
    </MotionConfig>
  );
}
