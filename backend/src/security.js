import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw httpError(400, "Enter a valid email address.");
  return email;
}

export function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 10 || password.length > 128) throw httpError(400, "Password must contain 10–128 characters.");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw httpError(400, "Password needs an uppercase letter, lowercase letter and number.");
  }
  return password;
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, saltText, hashText] = encoded.split("$");
    if (algorithm !== "scrypt") return false;
    const expected = Buffer.from(hashText, "base64url");
    const actual = Buffer.from(await scrypt(password, Buffer.from(saltText, "base64url"), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    }));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

export const opaqueToken = () => randomBytes(32).toString("base64url");
export const tokenHash = (token, pepper) => createHash("sha256").update(`${token}.${pepper}`).digest("hex");

export function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [decodeURIComponent(index < 0 ? part : part.slice(0, index)), decodeURIComponent(index < 0 ? "" : part.slice(index + 1))];
  }));
}

export function sessionCookie(name, token, maxAgeSeconds, secure = true) {
  const attrs = [`${name}=${encodeURIComponent(token)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];
  if (secure) attrs.push("Secure");
  return attrs.join("; ");
}

export function clearCookie(name, secure = true) { return sessionCookie(name, "", 0, secure); }
export function httpError(status, message, code = "BAD_REQUEST") { return Object.assign(new Error(message), { status, code }); }

export class RateLimiter {
  constructor(limit, windowMs) { this.limit = limit; this.windowMs = windowMs; this.buckets = new Map(); }
  consume(key) {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.reset <= now) { this.buckets.set(key, { count: 1, reset: now + this.windowMs }); return true; }
    current.count += 1;
    if (this.buckets.size > 10_000) for (const [k, v] of this.buckets) if (v.reset <= now) this.buckets.delete(k);
    return current.count <= this.limit;
  }
}
