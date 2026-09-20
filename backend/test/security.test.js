import test from "node:test";
import assert from "node:assert/strict";
import { clearCookie, hashPassword, normalizeEmail, opaqueToken, parseCookies, RateLimiter, sessionCookie, tokenHash, validatePassword, verifyPassword } from "../src/security.js";

test("passwords are salted and verifiable", async () => {
  const password = "StrongPassword123";
  const first = await hashPassword(password), second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong", first), false);
});

test("email normalization and password policy", () => {
  assert.equal(normalizeEmail(" Hasan@Example.COM "), "hasan@example.com");
  assert.throws(() => normalizeEmail("invalid"));
  assert.equal(validatePassword("StrongPassword123"), "StrongPassword123");
  assert.throws(() => validatePassword("weak"));
});

test("opaque tokens hash consistently with a pepper", () => {
  const token = opaqueToken();
  assert.ok(token.length >= 40);
  assert.equal(tokenHash(token, "pepper"), tokenHash(token, "pepper"));
  assert.notEqual(tokenHash(token, "pepper"), tokenHash(token, "other"));
});

test("session cookies use secure browser flags", () => {
  const cookie = sessionCookie("ryze_session", "token", 60, true);
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/); assert.match(cookie, /Secure/);
  assert.equal(parseCookies("a=1; ryze_session=hello%20world").ryze_session, "hello world");
  assert.match(clearCookie("ryze_session"), /Max-Age=0/);
});

test("rate limiter rejects requests above its window limit", () => {
  const limiter = new RateLimiter(2, 1000);
  assert.equal(limiter.consume("ip"), true); assert.equal(limiter.consume("ip"), true); assert.equal(limiter.consume("ip"), false);
});
