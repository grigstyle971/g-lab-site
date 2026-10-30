export function validNotebook(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some(
      (k) => !["notes", "url", "answers", "brief", "activities", "practiceChecks"].includes(k),
    )
  )
    return false;
  if (
    typeof v.notes !== "string" ||
    v.notes.length > 12000 ||
    typeof v.url !== "string" ||
    v.url.length > 1000
  )
    return false;
  if (v.url) {
    try {
      if (!["https:", "http:"].includes(new URL(v.url).protocol)) return false;
    } catch {
      return false;
    }
  }
  if (v.answers !== undefined) {
    if (!v.answers || typeof v.answers !== "object" || Array.isArray(v.answers))
      return false;
    if (
      Object.entries(v.answers).some(
        ([k, a]) =>
          !/^\d{1,2}$/.test(k) ||
          typeof a !== "number" ||
          !Number.isInteger(a) ||
          a < 0 ||
          a > 20,
      )
    )
      return false;
  }
  if (v.practiceChecks !== undefined) {
    if (
      !Array.isArray(v.practiceChecks) ||
      v.practiceChecks.length > 20 ||
      new Set(v.practiceChecks).size !== v.practiceChecks.length ||
      v.practiceChecks.some(check => typeof check !== "string" || !check.trim() || check.length > 500)
    ) return false;
  }
  if (v.brief !== undefined) {
    if (
      !v.brief ||
      typeof v.brief !== "object" ||
      Array.isArray(v.brief) ||
      Object.keys(v.brief).length > 20 ||
      Object.entries(v.brief).some(
        ([k, a]) => k.length > 80 || typeof a !== "string" || a.length > 2000,
      )
    )
      return false;
  }
  if (v.activities !== undefined) {
    if (
      !v.activities ||
      typeof v.activities !== "object" ||
      Array.isArray(v.activities)
    )
      return false;
    const a = v.activities as Record<string, unknown>;
    if (
      a.choice !== null &&
      (typeof a.choice !== "number" ||
        !Number.isInteger(a.choice) ||
        a.choice < 0 ||
        a.choice > 20)
    )
      return false;
    if (
      !Array.isArray(a.order) ||
      a.order.length !== 3 ||
      new Set(a.order).size !== 3 ||
      a.order.some(
        (n) => typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 2,
      )
    )
      return false;
  }
  return JSON.stringify(v).length <= 22000;
}
