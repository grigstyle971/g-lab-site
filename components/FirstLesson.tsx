"use client";
import { CloudWorkbook } from "./CloudWorkbook";
import { ProjectChallenge } from "./ProjectChallenge";
import { LessonActivities, type ActivitySnapshot } from "./LessonActivities";
import { Localize, useLocale } from "./LanguageProvider";

import { LanguageNote } from "./LanguageSwitcher";

import { BeginnerWalkthrough } from "./BeginnerWalkthrough";
import { LessonScreens, ScreenRefresher } from "./LessonScreens";
import { CompletionChecklist } from "./CompletionChecklist";
import { PracticeChecklist } from "./PracticeChecklist";
import { readLessonDraft, restorePracticeChecks } from "../lib/lesson-progress";
import Link from "next/link";
import { PromptCard } from "./PromptCard";
import { RealSiteExamples } from "./RealSiteExamples";
import { useEffect, useState } from "react";
import { defaultBrief, defaultBriefRu, evidenceChecks, firstLessonChapters, lessonPrompts, makeBuildPrompt, toolRoles, type BuildBrief } from "../lib/first-lesson";
const storageKey = "g-lab-codex-first-site-v1";
const quiz = [
    { question: "Codex says the site is ready. What should you do next?", answers: ["Open the preview and test the visitor's main action", "Assume every feature works", "Start a new project"], correct: 0, explanation: "Open the actual result. A completion message does not prove that the visitor can use it." },
    { question: "The main button does nothing. Which feedback helps most?", answers: ["Make the website better", "I clicked Plan your session on the homepage; I expected contacts but nothing happened. Please reproduce and fix it.", "Rewrite the whole website"], correct: 1, explanation: "Name the action, expected result and actual result so Codex can reproduce the problem." },
    { question: "Which tool will host the public website in this course?", answers: ["GitHub stores the project, so no host is needed", "Supabase always publishes every page", "Vercel hosts it; GitHub stores versions; Supabase adds sign-in and data"], correct: 2, explanation: "Each tool has a separate role. Codex implements the changes across the workflow." },
];
export function FirstLesson() {

    const locale=useLocale();
    const [brief, setBrief] = useState<BuildBrief>(locale === "ru" ? defaultBriefRu : defaultBrief);
    const [activitySnapshot,setActivitySnapshot]=useState<ActivitySnapshot>();
    const [restoreActivities,setRestoreActivities]=useState<ActivitySnapshot>();
    const [activitiesPassed, setActivitiesPassed] = useState(false);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [practiceChecks, setPracticeChecks] = useState<string[]>([]);
    const [reviewed, setReviewed] = useState(false);
    const [complete, setComplete] = useState(false);
    const [ready, setReady] = useState(false);
    const [status, setStatus] = useState("");
    useEffect(() => { try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const saved = JSON.parse(raw);
            if (saved.brief && Object.keys(defaultBrief).every(k => typeof saved.brief[k] === "string"))
                setBrief(Object.keys(defaultBrief).every(k=>saved.brief[k] === defaultBrief[k as keyof BuildBrief] || saved.brief[k] === defaultBriefRu[k as keyof BuildBrief]) ? (locale === "ru" ? defaultBriefRu : defaultBrief) : saved.brief);
            if(saved.answers && typeof saved.answers === "object") setAnswers(Object.fromEntries(Object.entries(saved.answers).filter(([i,a])=>quiz[Number(i)] && Number.isInteger(a) && typeof a === "number" && a>=0 && a<quiz[Number(i)].answers.length)) as Record<number,number>);
            setReviewed(saved.reviewed === true);
            setPracticeChecks(restorePracticeChecks(saved.practiceChecks, evidenceChecks));
            if (saved.complete === true)
                setComplete(true);
        }
    }
    catch {
        setStatus("Saved progress could not be restored. You can still complete the activities.");
    } setReady(true); }, []);
    useEffect(() => { if (!ready)
        return; try {
        localStorage.setItem(storageKey, JSON.stringify({ ...readLessonDraft(localStorage.getItem(storageKey)), brief, complete, answers, reviewed, practiceChecks }));
    }
    catch {
        setStatus("Browser storage is unavailable. Progress will last until you leave this page.");
    } }, [brief, complete, ready, answers, reviewed, practiceChecks]);
    const valid = Object.values(brief).every(v => v.trim().length > 0);
    const prompt = makeBuildPrompt(brief,locale);
    const canComplete = practiceChecks.length === evidenceChecks.length && activitiesPassed && reviewed && quiz.every((q, i) => answers[i] === q.correct);
    return <Localize>{<main className="first-lesson" lang="en"><LanguageNote /><nav className="fl-nav"><Link href="/" className="brand">G<span>-</span>lab</Link><Link href="/learn">← Course roadmap</Link><span>LESSON 01 · GUIDED PRACTICE</span></nav>
 <header className="fl-header"><p className="fl-kicker">YOU DIRECT. CODEX BUILDS.</p><h1>Your first website.<br /><em>Made with Codex.</em></h1><p>Describe your idea, open a real preview and turn your feedback into a better website. No code exercises.</p><div className="fl-meta"><span>Written lessons and practice</span><span>Allow 45–60 minutes plus setup</span><span>Codex desktop + browser</span></div><a href="#chapter-1" className="fl-primary">Start the lesson ↓</a></header>
 <section className="fl-tools" aria-label="Your four-tool workflow">{toolRoles.map((tool, i) => <article key={tool.name}><span>0{i + 1}</span><h2>{tool.name}</h2><p>{tool.job}</p><small>{tool.result}</small></article>)}</section>
 <div className="fl-body"><aside className="fl-toc"><p className="fl-kicker">BUILD ALONG</p>{firstLessonChapters.map((c, i) => <a key={c.title} href={`#chapter-${i + 1}`}>{String(i + 1).padStart(2, "0")} · {c.title}</a>)}<a href="#brief">Your build request</a><a href="#evidence">Practice and activities</a></aside><article className="fl-content">
 <section className="fl-outcome"><h2>What you will have by the end</h2><p>Your own website opens in a browser. You have tested its main action, requested one improvement and checked the change. You know how to return to the same project.</p><p>Today you work in Codex. Later, you will save this project in GitHub, publish it on Vercel and add sign-in and stored data with Supabase.</p></section>
 {firstLessonChapters.map((c, i) => <section className="fl-chapter" id={`chapter-${i + 1}`} key={c.title}><p className="fl-kicker">STEP {String(i + 1).padStart(2, "0")} / {c.screen}</p><h2>{c.title}</h2><p>{c.text}</p><div className="fl-do"><strong>Your turn</strong><p>{c.action}</p></div><p className="fl-note"><strong>How to tell it worked:</strong> {c.expected}</p><BeginnerWalkthrough slug="welcome" chapter={i + 1}/><LessonScreens slug="welcome" chapter={i + 1}/>{c.promptKey && <PromptCard title="Use this request in Codex" text={lessonPrompts[c.promptKey]}/>} {i === 2 && <p className="fl-note">Codex reference: <a href="https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan" target="_blank" rel="noreferrer">official Codex guide</a>. Preview reference: <a href="https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app" target="_blank" rel="noreferrer">official desktop browser guide</a>. Interface labels can change.</p>}{i === 3 && <a href="#brief">Personalise your build request ↓</a>}</section>)}
 <RealSiteExamples compact/><section className="fl-troubleshooting"><h2>If you get stuck</h2><details><summary>Codex gives me instructions instead of building</summary><p>Confirm that the task is attached to your project folder. Say: Implement this in the selected project and open a local preview. Explain any missing permission or setup that prevents you from doing it.</p></details><details><summary>The preview will not open</summary><p>Copy the exact address and browser error into the same task. Ask Codex to restart the preview, resolve the cause and confirm the page opens. Do not guess a different port.</p></details><details><summary>The page looks different from the example</summary><p>Generated designs vary. Check the required sections and action first. Describe one specific visual change, such as a shorter headline or more readable mobile text.</p></details><details><summary>My app has different buttons</summary><p>Use the official setup link above for your current version. Find the equivalent project or folder selector and confirm the folder with the setup request. Do not continue in an unrelated project.</p></details><details><summary>It says I need to sign in or have no usage available</summary><p>Codex is included with ChatGPT plans where available; usage limits vary. Check your account's Usage page and the guide above before changing plans or retrying.</p></details></section>
 </article></div>
 <section className="fl-practice" id="brief"><p className="fl-kicker">YOUR FIRST BUILD REQUEST</p><h2>Give Codex a clear job.</h2><p>This worksheet creates a request for you to copy. It does not run Codex or build a website inside this lesson.</p><div className="fl-brief-grid">{([{ key: "business", label: "What is the business?", hint: "A name and service. Use a fictional example for practice." }, { key: "audience", label: "Who is visiting?", hint: "A specific person and their situation." }, { key: "outcome", label: "What should they understand or achieve?", hint: "The useful result for this visitor." }, { key: "action", label: "What should the main button do?", hint: "A label and its actual destination or behaviour." }] as const).map(field => <label key={field.key} htmlFor={`brief-${field.key}`}><strong>{field.label}</strong><small>{field.hint}</small><textarea id={`brief-${field.key}`} value={brief[field.key]} maxLength={600} onChange={e => setBrief({ ...brief, [field.key]: e.target.value })}/></label>)}</div>{valid ? <PromptCard title="Paste this into your Codex project" text={prompt}/> : <p role="status">Complete all four fields to create your build request.</p>}<a href="#chapter-5">Continue with the build instructions ↑</a></section>
 <section className="fl-assessment" id="evidence"><ProjectChallenge slug="welcome" /><PracticeChecklist checks={evidenceChecks} confirmed={practiceChecks} onChange={setPracticeChecks} disabled={!ready}/><CloudWorkbook slug="welcome" checks={evidenceChecks} snapshot={{answers,brief,activities:activitySnapshot,practiceChecks}} onRestore={value=>{setPracticeChecks(restorePracticeChecks(value.practiceChecks, evidenceChecks));setRestoreActivities(value.activities ?? {choice:null,order:[1,2,0]});setActivitiesPassed(false);setAnswers(Object.fromEntries(Object.entries(value.answers||{}).filter(([i,a])=>quiz[Number(i)]&&Number.isInteger(a)&&a>=0&&a<quiz[Number(i)].answers.length)));if(value.brief&&Object.keys(defaultBrief).every(k=>typeof value.brief?.[k]==="string"))setBrief(value.brief as BuildBrief);setReviewed(false);}}/><LessonActivities slug={"welcome"} onPassChange={setActivitiesPassed} onSnapshotChange={setActivitySnapshot} restore={restoreActivities}/><h2 id="knowledge-check">What would you do next?</h2>{quiz.map((q, i) => <fieldset key={q.question}><legend>{i + 1}. {q.question}</legend>{q.answers.map((answer, j) => <label key={answer}><input type="radio" name={`question-${i}`} checked={answers[i] === j} onChange={() => { setAnswers({ ...answers, [i]: j }); setReviewed(false); }}/>{answer}</label>)}{reviewed && <p className={answers[i] === q.correct ? "pass" : "fail"}>{answers[i] === q.correct ? "Correct. " : "Try again. "}{q.explanation}</p>}</fieldset>)}<CompletionChecklist practiceConfirmed={practiceChecks.length} practiceTotal={evidenceChecks.length} activitiesPassed={activitiesPassed} answered={Object.keys(answers).length} correct={quiz.filter((q, i) => answers[i] === q.correct).length} questions={quiz.length} reviewed={reviewed} complete={complete}/><button onClick={() => setReviewed(true)}>Check answers</button><>{complete ? <Link className="fl-primary" href="/learn/codex-workflow">Next lesson →</Link> : <button className="fl-primary" aria-describedby="completion-requirements" disabled={!ready || (!canComplete && !complete)} onClick={() => { if (!ready || !canComplete) return; const next=true; try {
        const old: unknown = JSON.parse(localStorage.getItem("g-lab-course-completed") || "[]");
        localStorage.setItem("g-lab-course-completed", JSON.stringify(next ? [...new Set([...(Array.isArray(old) ? old.filter(x => typeof x === "string") : []), "welcome"])] : (Array.isArray(old) ? old.filter(x=>typeof x === "string" && x !== "welcome") : [])));
        setComplete(next); window.dispatchEvent(new Event("g-lab-progress-updated"));
    }
    catch {
        setStatus("Progress could not be saved in this browser.");
    } }}>Mark lesson as completed</button>}</><p className="fl-note">Complete the practical checks, both interactive activities and the knowledge questions to mark this lesson as completed.</p><p role="status">{status}</p><Link href="/learn/codex-workflow">Next: turn a first page into a useful website →</Link><p className="fl-note">Continue with the same project. Each lesson includes actions, expected results and interactive practice.</p></section>
 </main>}</Localize>;
}
