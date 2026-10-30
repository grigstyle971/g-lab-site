"use client";
import { Localize } from "./LanguageProvider";

export function CompletionChecklist({ practiceConfirmed, practiceTotal, activitiesPassed, answered, correct, questions, reviewed, complete }: {
    practiceConfirmed: number;
    practiceTotal: number;
    activitiesPassed: boolean;
    answered: number;
    correct: number;
    questions: number;
    reviewed: boolean;
    complete: boolean;

}) {

    const items = [
        { done: practiceConfirmed === practiceTotal, text: `Practice checks: ${practiceConfirmed} of ${practiceTotal} confirmed`, help: "Complete the project task, then confirm what you checked on your own website.", href: "#project-checks" },
        { done: activitiesPassed, text: "Interactive practice", help: "Solve the scenario, arrange the steps and check both activities.", href: "#interactive-practice" },
        { done: reviewed && correct === questions, text: reviewed ? `Knowledge check: ${correct} of ${questions} correct` : `Knowledge check: ${answered} of ${questions} answered`, help: answered < questions ? "Answer the remaining questions, then select Check answers." : !reviewed ? "Select Check answers to verify your choices." : "Review the feedback, change your answers and check again.", href: "#knowledge-check" },
    ];
    const remaining = items.filter(item => !item.done).length;
    return <Localize>{<div className="fl-completion" id="completion-requirements">
    <p className="fl-kicker">YOUR LESSON PROGRESS</p>
    <h3 aria-live="polite" aria-atomic="true">{complete ? "This lesson is marked as completed." : remaining ? `${remaining} ${remaining === 1 ? "step" : "steps"} left to mark this lesson as completed` : "Ready — mark your lesson as completed below."}</h3>
    <p className="fl-note">Your progress is saved in this browser. You can revisit any lesson without losing completion.</p>
    {!complete && <ul>{items.map(item => <li key={item.href} className={item.done ? "is-done" : ""}><span className="fl-check-icon" aria-hidden="true">{item.done ? "✓" : "○"}</span><div><strong>{item.text}</strong>{!item.done && <><p>{item.help}</p><a href={item.href}>Go to this step ↑</a></>}</div></li>)}</ul>}
  </div>}</Localize>;
}
