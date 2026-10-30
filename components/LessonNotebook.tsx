"use client";
import { CloudWorkbook } from "./CloudWorkbook";
import { ProjectChallenge } from "./ProjectChallenge";
import { LessonActivities, type ActivitySnapshot } from "./LessonActivities";
import Link from "next/link";
import { Localize } from "./LanguageProvider";


import { CompletionChecklist } from "./CompletionChecklist";
import { PracticeChecklist } from "./PracticeChecklist";
import { readLessonDraft, restorePracticeChecks } from "../lib/lesson-progress";
import { useEffect, useState } from "react";
import type { PracticalLessonData } from "../lib/lessons/types";
const completedKey = "g-lab-course-completed";
export function LessonNotebook({ lesson, nextSlug }: {
    nextSlug?: string;
    lesson: PracticalLessonData;
}) {

    const storageKey = `g-lab-practical-${lesson.slug}-v1`;
    const [activitySnapshot,setActivitySnapshot]=useState<ActivitySnapshot>();
    const [restoreActivities,setRestoreActivities]=useState<ActivitySnapshot>();
    const [activitiesPassed, setActivitiesPassed] = useState(false);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [practiceChecks, setPracticeChecks] = useState<string[]>([]);
    const [reviewed, setReviewed] = useState(false);
    const [complete, setComplete] = useState(false);
    const [ready, setReady] = useState(false);
    const [status, setStatus] = useState("");
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            const saved: unknown = raw ? JSON.parse(raw) : null;
            if (saved && typeof saved === "object") {
                const value = saved as Record<string, unknown>;
                setPracticeChecks(restorePracticeChecks(value.practiceChecks, lesson.checks));
                if (value.answers && typeof value.answers === "object") {
                    const valid: Record<number, number> = {};
                    for (const [key, answer] of Object.entries(value.answers)) {
                        const index = Number(key);
                        if (Number.isInteger(index) && lesson.quiz[index] && typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < lesson.quiz[index].answers.length)
                            valid[index] = answer;
                    }
                    setAnswers(valid);
                }
                setReviewed(value.reviewed === true);
            }
            const done: unknown = JSON.parse(localStorage.getItem(completedKey) || "[]");
            setComplete(Array.isArray(done) && done.includes(lesson.slug));
        }
        catch {
            setStatus("Saved progress could not be restored. You can still complete the activities.");
        }
        setReady(true);
    }, [storageKey, lesson.slug, lesson.quiz, lesson.checks]);
    useEffect(() => {
        if (!ready)
            return;
        try {
            localStorage.setItem(storageKey, JSON.stringify({ ...readLessonDraft(localStorage.getItem(storageKey)), answers, reviewed, practiceChecks }));
        }
        catch {
            setStatus("Browser storage is unavailable. Progress will last until you leave this page.");
        }
    }, [storageKey, ready, answers, reviewed, practiceChecks]);
    const passed = practiceChecks.length === lesson.checks.length && activitiesPassed && reviewed && lesson.quiz.every((q, i) => answers[i] === q.correct);
    const markComplete = () => {
        if (!ready || !passed) return;
        const next = true;
        try {
            const saved: unknown = JSON.parse(localStorage.getItem(completedKey) || "[]");
            const valid = Array.isArray(saved) ? saved.filter((s): s is string => typeof s === "string") : [];
            localStorage.setItem(completedKey, JSON.stringify(next ? [...new Set([...valid, lesson.slug])] : valid.filter(s => s !== lesson.slug)));
            window.dispatchEvent(new Event("g-lab-progress-updated"));
            setComplete(next);
            setStatus("Lesson marked complete in this browser.");
        }
        catch {
            setStatus("Progress could not be saved in this browser.");
        }
    };
    return <Localize>{<section className="fl-assessment" id="evidence">
    <ProjectChallenge slug={lesson.slug} />
    <PracticeChecklist checks={lesson.checks} confirmed={practiceChecks} onChange={setPracticeChecks} disabled={!ready}/>
    <CloudWorkbook slug={lesson.slug} checks={lesson.checks} snapshot={{answers,activities:activitySnapshot,practiceChecks}} onRestore={value=>{setRestoreActivities(value.activities ?? {choice:null,order:[1,2,0]});setActivitiesPassed(false);setPracticeChecks(restorePracticeChecks(value.practiceChecks, lesson.checks));setAnswers(Object.fromEntries(Object.entries(value.answers||{}).filter(([i,a])=>lesson.quiz[Number(i)]&&Number.isInteger(a)&&a>=0&&a<lesson.quiz[Number(i)].answers.length)));setReviewed(false);}}/>
    <LessonActivities slug={lesson.slug} onPassChange={setActivitiesPassed} onSnapshotChange={setActivitySnapshot} restore={restoreActivities}/><h2 id="knowledge-check">What would you do next?</h2>{lesson.quiz.map((q, i) => <fieldset key={q.question}><legend>{i + 1}. {q.question}</legend>{q.answers.map((answer, j) => <label key={answer}><input type="radio" name={`${lesson.slug}-question-${i}`} checked={answers[i] === j} onChange={() => { setAnswers({ ...answers, [i]: j }); setReviewed(false); }}/>{answer}</label>)}{reviewed && <p className={answers[i] === q.correct ? "pass" : "fail"}>{answers[i] === q.correct ? "Correct. " : "Try again. "}{q.explanation}</p>}</fieldset>)}
    <CompletionChecklist practiceConfirmed={practiceChecks.length} practiceTotal={lesson.checks.length} activitiesPassed={activitiesPassed} answered={Object.keys(answers).length} correct={lesson.quiz.filter((q, i) => answers[i] === q.correct).length} questions={lesson.quiz.length} reviewed={reviewed} complete={complete}/><div className="fl-toolbar"><button type="button" onClick={() => setReviewed(true)}>Check answers</button>{complete ? <Link className="fl-primary" href={nextSlug ? `/learn/${nextSlug}` : "/learn"}>{nextSlug ? "Next lesson →" : "Return to course roadmap →"}</Link> : <button type="button" className="fl-primary" aria-describedby="completion-requirements" disabled={!ready || (!passed && !complete)} onClick={markComplete}>Mark lesson as completed</button>}</div>
    <p className="fl-note">Complete the practical checks, both interactive activities and the knowledge questions to mark this lesson as completed.</p><p role="status">{status}</p>
  </section>}</Localize>;
}
