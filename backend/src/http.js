import { httpError } from "./security.js";

export async function readJson(req, maxBytes = 100_000) {
  const declared = Number(req.headers["content-length"] || 0);
  if (declared > maxBytes) throw httpError(413, "Request body is too large.", "PAYLOAD_TOO_LARGE");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw httpError(413, "Request body is too large.", "PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw httpError(400, "Request body must be valid JSON.", "INVALID_JSON"); }
}

export function send(res, status, data, headers = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload), "Cache-Control": "no-store", ...headers });
  res.end(payload);
}

export function pathMatch(pattern, pathname) {
  const names = [];
  const expression = pattern.replace(/:[^/]+/g, (part) => { names.push(part.slice(1)); return "([^/]+)"; });
  const match = pathname.match(new RegExp(`^${expression}/?$`));
  if (!match) return null;
  return Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
}

export function text(value, min, max, label) {
  const result = String(value || "").trim();
  if (result.length < min || result.length > max) throw httpError(400, `${label} must contain ${min}–${max} characters.`);
  return result;
}

export function integer(value, min, max, label) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) throw httpError(400, `${label} must be between ${min} and ${max}.`);
  return result;
}
