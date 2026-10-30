"use client";
import { LessonFeedback } from "./LessonFeedback";
import { PromptCard } from "./PromptCard";
import { challengeExamples } from "../lib/challenge-examples";
import { useLocale } from "./LanguageProvider";
import { courseChallenges } from "../lib/course-challenges";
export function ProjectChallenge({ slug }: { slug: string }) {
  const locale = useLocale();
  const item = courseChallenges[slug];
  if (!item) return null;
  const index = locale === "ru" ? 1 : 0;
  const ru = locale === "ru";
  return <section className="project-challenge" aria-labelledby={`challenge-${slug}`}>
    <p className="fl-kicker">{ru ? "ПРАКТИКА НА ВАШЕМ САЙТЕ" : "ON YOUR OWN WEBSITE"}</p>
    <h2 id={`challenge-${slug}`}>{item.title[index]}</h2>
    <p>{item.task[index]}</p>
    <div className="project-challenge-evidence"><h3>{ru ? "Что сохранить после задания" : "What to keep when you finish"}</h3><p>{item.evidence[index]}</p></div>
    <p className="fl-note">{ru ? "Продолжайте один и тот же сайт весь курс. Каждое задание помогает создать или проверить очередную часть итогового проекта." : "Keep the same website throughout the course. Each assignment helps build or verify part of your final project."}</p>
    <details><summary>{ru ? "Пример достаточного результата" : "An example of a sufficient result"}</summary><p>{challengeExamples[slug]?.[index]}</p><p className="fl-note">{ru ? "Это учебный пример записи. Подставьте свой результат и отмечайте только выполненные проверки." : "This is an illustrative note. Use your own result and only record checks you actually performed."}</p></details>
    <details><summary>{ru ? "Я застрял — что делать?" : "I’m stuck — what next?"}</summary>
    <p>{ru ? "Сначала повторите действие и запишите точный текст ошибки. Если экран отличается от урока, опишите, что видите. Уберите пароли, ключи и данные клиентов из сообщения и скриншотов." : "Repeat the action and record the exact error. If your screen differs from the lesson, describe what you see. Remove passwords, keys and customer data from messages and screenshots."}</p>
    <PromptCard title={ru ? "Запрос для разбора проблемы" : "A request to investigate the problem"} text={ru ? "Помоги разобраться в текущем проекте. Задача: [что хочу получить]. Шаги: [что нажал или сделал]. Ожидал: [результат]. Получилось: [результат и точная ошибка]. Последнее изменение: [что менял]. Сначала выясни причину, предложи минимальную правку и объясни, как её проверить. Не удаляй данные и не публикуй изменения без моего согласия." : "Help me investigate this project. Goal: [what I need]. Steps: [what I clicked or did]. Expected: [result]. Actual: [result and exact error]. Last change: [what changed]. Investigate the cause first, suggest a minimal fix and explain how to verify it. Do not delete data or publish changes without my agreement."}/>
    <a href="mailto:glab.tech.support@gmail.com">{ru ? "Нужна помощь с доступом? Напишите нам" : "Need help accessing the course? Contact us"}</a></details>
    {slug === "client-space" && <div className="project-challenge-evidence"><h3>{ru ? "Соберите итоговый разбор" : "Prepare your final project review"}</h3><p>{ru ? "Сохраните ссылку на сайт, два скриншота, задачу посетителя, три решения с объяснением и результаты проверки входа и доступа к данным. Укажите, что пока не работает. Если есть желающий, попросите его пройти основной путь без подсказок и запишите одно затруднение и правку по итогам. Если работаете самостоятельно, вернитесь к сайту позже, пройдите тот же путь без заметок и отметьте, что это самопроверка." : "Keep the website URL, two screenshots, the visitor’s goal, three decisions with reasons and your sign-in and data-access checks. State any limitations. If someone is available, ask them to try the main journey without hints and record one point of confusion and the change you made. If you are working alone, return later, repeat the journey without your notes and label it as a self-review."}</p></div>}
    <details><summary>{ru ? "Как проверить себя" : "How to review your work"}</summary>
      <ol><li>{ru ? "Получилось ли выполнить задачу на самом сайте? Запишите, что вы попробовали и что произошло." : "Did the task work on your actual website? Write what you tried and what happened."}</li>
      <li>{ru ? "Можете объяснить, зачем нужна эта правка, без подсказки из урока?" : "Can you explain why this change matters without looking back at the lesson?"}</li>
      <li>{ru ? "Что ещё не проверено? Запишите один следующий шаг, а не отмечайте его выполненным заранее." : "What still needs checking? Write down one next step instead of marking an untested result as done."}</li></ol>
      <p className="fl-note">{ru ? "Добавьте ответы в заметки своего проекта. Это самопроверка: курс не отправляет вашу работу преподавателю." : "Add your answers to your project notes. This is a self-review; the course does not send your work to a tutor."}</p>
    </details>
    <LessonFeedback slug={slug}/>
  </section>;
}
