import Link from "next/link";
import { ArrowIcon } from "../components/ArrowIcon";
import { GlFooter, GlNav } from "../components/GlChrome";
import { glFonts } from "./gl-fonts";

export default function AboutPage({ locale = "en" }: { locale?: "en" | "ru" }) {
  const ru = locale === "ru";
  const prefix = ru ? "/ru" : "";

  return (
    <main className={`gl ${glFonts}`}>
      <GlNav ru={ru} current="about" />

      <section className="gl-page-hero gl-wrap gl-about-hero">
        <div>
          <h1>{ru ? <>Сайты для бизнеса.<br /><i>Обучение на практике.</i></> : <>Websites for business.<br /><i>Learning by doing.</i></>}</h1>
          <p className="gl-lead">
            {ru
              ? "G-lab создаёт сайты для бизнеса и помогает пройти путь от идеи до опубликованного проекта на практическом курсе."
              : "G-lab builds websites for businesses and teaches the path from a first idea to a published project through a practical course."}
          </p>
        </div>
        <figure className="gl-person" aria-labelledby="about-person-name">
          <span className="gl-person-mark" aria-hidden="true">G<b>-</b></span>
          <figcaption><strong id="about-person-name">Roman Grigorev</strong><span>{ru ? "Владелец G-lab" : "G-lab owner"}</span></figcaption>
        </figure>
      </section>

      <section className="gl-sec gl-wrap" aria-label={ru ? "Чем занимается G-lab" : "What G-lab does"}>
        <div className="gl-rows">
          <Link className="gl-row" href={`${prefix}/#contact`}>
            <h3>{ru ? "Сайты под задачи бизнеса" : "Websites shaped around your business"}</h3>
            <p>{ru
              ? "Проектирование, разработка и запуск сайтов для бизнеса. Структуру и содержание определяем исходя из задачи компании и действий, которые нужны посетителю."
              : "Design, development and launch for business websites. We shape the structure and content around the company’s goals and the actions visitors need to take."}</p>
            <span className="gl-arrow" aria-hidden="true"><ArrowIcon /></span>
          </Link>
          <Link className="gl-row" href={`${prefix}/courses/build-with-codex`}>
            <h3>{ru ? "Создание сайтов с Codex" : "Build a website with Codex"}</h3>
            <p>{ru
              ? "Самостоятельный курс из 16 практических уроков: создайте сайт, сохраните проект в GitHub и опубликуйте его через Vercel. По ходу курса также разбираются аккаунты и данные на Supabase."
              : "A self-paced course with 16 practical lessons. Build a website, save the project on GitHub and publish it with Vercel. The course also introduces accounts and data with Supabase."}</p>
            <span className="gl-arrow" aria-hidden="true"><ArrowIcon /></span>
          </Link>
        </div>
      </section>

      <section className="gl-sec gl-dark">
        <div className="gl-wrap gl-contact">
          <div>
            <h2 className="gl-h2">{ru ? "Напишите в G-lab" : "Get in touch with G-lab"}</h2>
            <p className="gl-sub">{ru ? "По вопросам создания сайта и сотрудничества — почта или телефон." : "For website and project enquiries — email or phone."}</p>
          </div>
          <div className="gl-contact-list">
            <a href="mailto:grigstyle971@gmail.com"><span>{ru ? "Почта" : "Email"}</span>grigstyle971@gmail.com<ArrowIcon /></a>
            <a href="tel:+77006251757"><span>{ru ? "Телефон" : "Phone"}</span>+7 700 625 17 57<ArrowIcon /></a>
            <a href="mailto:glab.tech.support@gmail.com"><span>{ru ? "Поддержка курса и аккаунта" : "Course and account support"}</span>glab.tech.support@gmail.com<ArrowIcon /></a>
          </div>
        </div>
      </section>

      <GlFooter ru={ru} />
    </main>
  );
}
