import { firebaseAdmin } from "@/lib/firebase-admin";

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";
const TOKEN_DOC = "integrations/cj";

type CjEnvelope<T> = {
  code?: number;
  result?: boolean;
  success?: boolean;
  message?: string;
  data: T;
  requestId?: string;
};

export class CjError extends Error {
  constructor(message: string, public status = 502, public requestId?: string) {
    super(message);
  }
}

function apiKey() {
  const value = process.env.CJ_API_KEY?.trim();
  if (!value) throw new CjError("CJ Dropshipping is not configured.", 503);
  return value;
}

async function parse<T>(response: Response): Promise<CjEnvelope<T>> {
  const payload = (await response.json().catch(() => null)) as CjEnvelope<T> | null;
  if (!response.ok || !payload || (payload.code != null && payload.code !== 200)) {
    throw new CjError(
      payload?.message || `CJ request failed (${response.status}).`,
      response.status >= 400 && response.status < 500 ? 400 : 502,
      payload?.requestId,
    );
  }
  return payload;
}

async function getAccessToken() {
  const ref = firebaseAdmin().db.doc(TOKEN_DOC);
  const saved = await ref.get();
  const cached = saved.data();
  const expires = cached?.accessTokenExpiryDate
    ? Date.parse(cached.accessTokenExpiryDate)
    : 0;
  if (cached?.accessToken && expires > Date.now() + 24 * 60 * 60 * 1000)
    return String(cached.accessToken);

  const response = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: apiKey() }),
    cache: "no-store",
  });
  const payload = await parse<{
    accessToken: string;
    accessTokenExpiryDate: string;
    refreshToken?: string;
    refreshTokenExpiryDate?: string;
  }>(response);
  await ref.set({ ...payload.data, updatedAt: Date.now() }, { merge: true });
  return payload.data.accessToken;
}

export async function cjRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; query?: Record<string, string | number | undefined>; body?: unknown } = {},
) {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(options.query || {}))
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));

  const token = await getAccessToken();
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "CJ-Access-Token": token,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  return (await parse<T>(response)).data;
}

export function isCjAdmin(email: string) {
  const allowed = (process.env.CJ_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export function importedPrice(usd: string | number) {
  const rate = Number(process.env.CJ_USD_INR_RATE || 85);
  const markup = Number(process.env.CJ_PRICE_MARKUP || 2);
  const amount = Number(usd);
  if (![rate, markup, amount].every(Number.isFinite) || amount <= 0)
    throw new CjError("CJ returned an invalid product price.");
  return Math.max(99, Math.ceil((amount * rate * markup) / 10) * 10 - 1);
}
