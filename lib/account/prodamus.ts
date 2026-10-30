import { createHmac, timingSafeEqual } from "node:crypto";
export type SignedValue =
  | string
  | number
  | boolean
  | null
  | SignedValue[]
  | { [key: string]: SignedValue };
// Matches Prodamus Hmac.php: stringify leaves, recursively sort, unescaped Unicode, escaped slashes.
function canonical(value: SignedValue): SignedValue {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  if (value === null || value === false) return "";
  return value === true ? "1" : String(value);
}
export function signProdamus(
  data: Record<string, SignedValue>,
  secret: string,
) {
  const json = JSON.stringify(canonical(data))
    .replace(/\//g, "\\/")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return createHmac("sha256", secret).update(json).digest("hex");
}
export function verifyProdamus(
  data: Record<string, SignedValue>,
  signature: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(
    Buffer.from(signProdamus(data, secret), "hex"),
    Buffer.from(signature, "hex"),
  );
}
export function moneyToMinor(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,9}(?:\.\d{1,2})?$/.test(value))
    return null;
  const [whole, cents = ""] = value.split(".");
  return Number(whole) * 100 + Number(cents.padEnd(2, "0"));
}
export function validProdamusUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !(url.hostname === "payform.ru" || url.hostname.endsWith(".payform.ru")) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error("Invalid Prodamus URL");
  return url;
}
export function formFields(data: Record<string, SignedValue>) {
  const params = new URLSearchParams();
  function add(key: string, value: SignedValue) {
    if (value && typeof value === "object")
      Object.entries(value).forEach(([k, v]) => add(`${key}[${k}]`, v));
    else params.append(key, String(value ?? ""));
  }
  Object.entries(data).forEach(([key, value]) => add(key, value));
  return params;
}
// Parse PHP-style nested form fields while rejecting duplicate and prototype keys.
export function parseProdamusFields(
  entries: Iterable<[string, FormDataEntryValue]>,
): Record<string, SignedValue> {
  const result: Record<string, SignedValue> = Object.create(null);
  for (const [key, value] of entries) {
    if (
      typeof value !== "string" ||
      !/^[A-Za-z0-9_]+(?:\[[A-Za-z0-9_]+\])*$/.test(key)
    )
      throw new Error("Invalid field");
    const parts = key.match(/[A-Za-z0-9_]+/g)!;
    if (parts.some((x) => /^\d+$/.test(x) && Number(x) > 1000))
      throw new Error("Array index too large");
    if (
      parts.length > 6 ||
      parts.some((x) => ["__proto__", "constructor", "prototype"].includes(x))
    )
      throw new Error("Invalid key");
    let cursor = result;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        if (Object.hasOwn(cursor, part)) throw new Error("Duplicate field");
        cursor[part] = value;
      } else {
        if (!Object.hasOwn(cursor, part))
          cursor[part] = /^\d+$/.test(parts[i + 1]) ? [] : Object.create(null);
        if (!cursor[part] || typeof cursor[part] !== "object")
          throw new Error("Field collision");
        cursor = cursor[part] as Record<string, SignedValue>;
      }
    });
  }
  return result;
}
