// Store the source wording so a changed requirement is not silently confirmed
// by an old checkbox at the same position. The UI translates the label only.
export function restorePracticeChecks(value: unknown, checks: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return checks.filter(check => value.includes(check));
}

export function readLessonDraft(raw: string | null): Record<string, unknown> {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  } catch {
    // A malformed older draft must not prevent future saves.
    return {};
  }
}
