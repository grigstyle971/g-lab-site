"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "../lib/course";

const lessonsKey = "g-lab-course-completed";
const stepsKey = "g-lab-course-steps";

export function LessonWorkspace({
  lesson,
  prompt,
}: {
  lesson: Lesson;
  prompt: string;
}) {
  const [steps, setSteps] = useState<number[]>([]);
  const [complete, setComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const savedSteps = JSON.parse(
        window.localStorage.getItem(stepsKey) || "{}",
      ) as Record<string, number[]>;
      const savedLessons = JSON.parse(
        window.localStorage.getItem(lessonsKey) || "[]",
      ) as string[];
      setSteps(savedSteps[lesson.slug] || []);
      setComplete(savedLessons.includes(lesson.slug));
    } catch {
      setSteps([]);
      setComplete(false);
    }
  }, [lesson.slug]);

  const toggleStep = (index: number) => {
    const next = steps.includes(index)
      ? steps.filter((step) => step !== index)
      : [...steps, index].sort((a, b) => a - b);
    setSteps(next);
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(stepsKey) || "{}",
      ) as Record<string, number[]>;
      window.localStorage.setItem(
        stepsKey,
        JSON.stringify({ ...saved, [lesson.slug]: next }),
      );
    } catch {
      /* Storage is optional for the learning experience. */
    }
  };

  const toggleComplete = () => {
    const next = !complete;
    setComplete(next);
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(lessonsKey) || "[]",
      ) as string[];
      window.localStorage.setItem(
        lessonsKey,
        JSON.stringify(
          next
            ? [...new Set([...saved, lesson.slug])]
            : saved.filter((slug) => slug !== lesson.slug),
        ),
      );
    } catch {
      /* Storage is optional for the learning experience. */
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="lesson-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">PRACTICAL ASSIGNMENT</p>
          <h2>Submit the work to yourself.</h2>
        </div>
        <span>
          {steps.length} / {lesson.steps.length} complete
        </span>
      </div>
      <p className="workspace-intro">
        Complete every item in your own project. Keep a screenshot, link, commit
        or written decision as evidence before marking the lesson complete.
      </p>
      <ol className="workspace-steps">
        {lesson.steps.map((step, index) => (
          <li key={step} className={steps.includes(index) ? "is-done" : ""}>
            <button
              type="button"
              onClick={() => toggleStep(index)}
              aria-pressed={steps.includes(index)}
            >
              <i>
                {steps.includes(index)
                  ? "✓"
                  : String(index + 1).padStart(2, "0")}
              </i>
              <span>{step}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="lesson-prompt">
        <div>
          <div>
            <p className="eyebrow">YOUR CODEX BRIEF</p>
            <span className="prompt-hint">
              Copy, personalise the brackets, then build.
            </span>
          </div>
          <button type="button" onClick={copy} className="copy-prompt">
            {copied ? "Copied ✓" : "Copy brief"}
          </button>
        </div>
        <p>{prompt}</p>
      </div>
      <div className="workspace-footer">
        <p>
          <b>Your deliverable:</b> {lesson.objective}
        </p>
        <button
          type="button"
          onClick={toggleComplete}
          className={"complete-button " + (complete ? "is-complete" : "")}
        >
          {complete ? "✓ Lesson complete" : "Mark lesson complete"}
        </button>
      </div>
    </section>
  );
}
