"use client";
import { Localize } from "./LanguageProvider";

import { useEffect, useState } from "react";
const key = "g-lab-course-completed";
export function CourseProgress({ lessonSlug, total, isDashboard = false, lessonSlugs }: {
    lessonSlug?: string;
    total: number;
    isDashboard?: boolean;
    lessonSlugs?: string[];
}) {
    const [completed, setCompleted] = useState<string[]>([]);
    useEffect(() => {
        const read = () => { try {
            const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]");
            setCompleted(Array.isArray(saved) ? [...new Set(saved.filter((s): s is string => typeof s === "string" && (!lessonSlugs || lessonSlugs.includes(s))))] : []);
        }
        catch {
            setCompleted([]);
        } };
        read();
        window.addEventListener("storage", read);
        window.addEventListener("g-lab-progress-updated", read);
        return () => { window.removeEventListener("storage", read); window.removeEventListener("g-lab-progress-updated", read); };
    }, [lessonSlugs]);
    const count = Math.min(completed.length, total);
    const percent = total > 0 ? Math.round(count / total * 100) : 0;
    const toggle = () => { if (!lessonSlug)
        return; const next = completed.includes(lessonSlug) ? completed.filter(s => s !== lessonSlug) : [...completed, lessonSlug]; try {
        localStorage.setItem(key, JSON.stringify(next));
        setCompleted(next);
        window.dispatchEvent(new Event("g-lab-progress-updated"));
    }
    catch { /* Optional browser persistence. */ } };
    if (isDashboard)
        return <Localize>{<div className="progress-summary"><div><span>YOUR PROGRESS</span><b>{percent}%</b></div><div className="progress-track"><i style={{ width: `${percent}%` }}/></div><p>{count} of {total} lessons complete</p></div>}</Localize>;
    const done = !!lessonSlug && completed.includes(lessonSlug);
    return <Localize>{<button onClick={toggle} className={`complete-button ${done ? "is-complete" : ""}`}>{done ? "✓ Lesson complete" : "Mark as complete"}</button>}</Localize>;
}
