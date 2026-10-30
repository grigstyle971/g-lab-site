import { validNotebook } from "./account/notebook";

export type WorkbookSnapshot = {
  answers: Record<number, number>;
  brief?: Record<string, string>;
  activities?: { choice: number | null; order: number[] };
  practiceChecks?: string[];
};
export type WorkbookContent = WorkbookSnapshot & { notes: string; url: string };
export const maxWorkbookFileBytes = 100_000;
type BackupResult =
  | { ok: true; content: WorkbookContent }
  | { ok: false; error: "invalid" | "lesson" | "version" | "size" };

export function makeWorkbookBackup(lesson: string, content: WorkbookContent) {
  return JSON.stringify({ format: "g-lab-workbook", version: 1, lesson, content }, null, 2);
}

export function readWorkbookBackup(text: string, lesson: string): BackupResult {
  if (new TextEncoder().encode(text).length > maxWorkbookFileBytes) return { ok: false, error: "size" };
  let value: unknown;
  try { value = JSON.parse(text); } catch { return { ok: false, error: "invalid" }; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "invalid" };
  const record = value as Record<string, unknown>;
  if (record.lesson !== lesson) return { ok: false, error: "lesson" };
  let content: unknown;
  if (record.format !== undefined || record.version !== undefined) {
    if (record.format !== "g-lab-workbook" || record.version !== 1) return { ok: false, error: "version" };
    content = record.content;
  } else {
    // Earlier downloads used a flat { lesson, notes, url, answers, ... } object.
    const { lesson: _lesson, ...legacy } = record;
    content = legacy;
  }
  if (!content || typeof content !== "object" || Array.isArray(content)) return { ok: false, error: "invalid" };
  const draft = content as Record<string, unknown>;
  // A local backup must also preserve an unfinished URL. Account saves still
  // enforce valid http(s) URLs; imported URLs are displayed as plain text only.
  if (typeof draft.url !== "string" || draft.url.length > 1000 || !validNotebook({ ...draft, url: "" })) return { ok: false, error: "invalid" };
  const valid = content as WorkbookContent;
  return { ok: true, content: { ...valid, answers: valid.answers ?? {} } };
}

// Object key order and checkbox click order are not changes to the learner's work.
export function snapshotFingerprint(value: WorkbookSnapshot): string {
  return JSON.stringify({
    answers: Object.entries(value.answers || {}).sort(([a], [b]) => Number(a) - Number(b)),
    brief: Object.entries(value.brief || {}).sort(([a], [b]) => a.localeCompare(b)),
    activities: value.activities ?? { choice: null, order: [1, 2, 0] },
    checks: [...(value.practiceChecks || [])].sort(),
  });
}
