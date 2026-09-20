const required = ["DATABASE_URL", "TOKEN_PEPPER", "FRONTEND_ORIGIN"];

export function loadConfig(env = process.env) {
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  if (env.NODE_ENV === "production" && env.TOKEN_PEPPER.length < 32) {
    throw new Error("TOKEN_PEPPER must contain at least 32 characters in production");
  }
  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  return Object.freeze({
    nodeEnv: env.NODE_ENV || "development",
    port,
    databaseUrl: env.DATABASE_URL,
    frontendOrigins: env.FRONTEND_ORIGIN.split(",").map((x) => x.trim()).filter(Boolean),
    sessionCookie: env.SESSION_COOKIE || "ryze_session",
    sessionTtlMs: Number(env.SESSION_TTL_DAYS || 30) * 86_400_000,
    tokenPepper: env.TOKEN_PEPPER,
    trustProxy: env.TRUST_PROXY === "true",
    logLevel: env.LOG_LEVEL || "info",
  });
}
