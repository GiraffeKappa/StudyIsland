import { createHmac, timingSafeEqual } from "node:crypto";
export type AccessRole = "student" | "parent";
export type AccessKeys = { student: string; parent: string };
export function accessKeys(): AccessKeys {
  return {
    student: process.env.STUDENT_ACCESS_KEY || "",
    parent: process.env.PARENT_ACCESS_KEY || "",
  };
}
export function linksReady(keys = accessKeys()) {
  return (
    keys.student.length >= 32 &&
    keys.parent.length >= 32 &&
    keys.student !== keys.parent
  );
}
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function accessRole(
  token: string,
  keys = accessKeys(),
): AccessRole | null {
  if (!linksReady(keys) || token.length > 150) return null;
  const student = equal(token, keys.student),
    parent = equal(token, keys.parent);
  return student ? "student" : parent ? "parent" : null;
}
const sessionKey = (keys: AccessKeys) =>
  createHmac("sha256", keys.student).update(keys.parent).digest();
export function makeSession(
  role: AccessRole,
  keys = accessKeys(),
  now = Date.now(),
) {
  if (!linksReady(keys)) throw Error("家庭連結尚未設定");
  const body = Buffer.from(
    JSON.stringify({ role, expires: now + 365 * 86400000 }),
  ).toString("base64url");
  return (
    body +
    "." +
    createHmac("sha256", sessionKey(keys)).update(body).digest("base64url")
  );
}
export function sessionRole(
  value: string,
  keys = accessKeys(),
  now = Date.now(),
): AccessRole | null {
  if (!linksReady(keys) || value.length > 1000) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const signature = createHmac("sha256", sessionKey(keys))
    .update(parts[0])
    .digest("base64url");
  if (!equal(signature, parts[1])) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    return (p.role === "student" || p.role === "parent") &&
      Number.isFinite(p.expires) &&
      p.expires > now
      ? p.role
      : null;
  } catch {
    return null;
  }
}
