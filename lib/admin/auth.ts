import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Standalone admin-portal session.
 *
 * The admin portal is intentionally decoupled from the student/employer
 * Supabase session so operators can sign in at /admin/signin on a fresh
 * environment (for example localhost) before Supabase auth users exist.
 *
 * Credentials come from the environment and fall back to the documented
 * testing account.
 */
export const ADMIN_SESSION_COOKIE = "calibiai_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export const DEFAULT_ADMIN_EMAIL = "admin@calibiai.local";
export const DEFAULT_ADMIN_PASSWORD = "admin@90";

export type AdminSession = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

export function adminEmail() {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

export function usingDefaultAdminCredentials() {
  return !process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD;
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || `calibiai-admin::${adminEmail()}::${adminPassword()}`;
}

function timingSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function verifyAdminCredentials(email: string, password: string) {
  const emailOk = timingSafeEqual(String(email ?? "").trim().toLowerCase(), adminEmail());
  const passwordOk = timingSafeEqual(String(password ?? ""), adminPassword());
  return emailOk && passwordOk;
}

export function createAdminSessionToken(email: string): { token: string; session: AdminSession } {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const session: AdminSession = { email: email.trim().toLowerCase(), issuedAt, expiresAt };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return { token: `${payload}.${sign(payload)}`, session };
}

export function readAdminSessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!timingSafeEqual(signature, sign(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AdminSession>;
    if (typeof parsed.email !== "string" || typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt < Date.now()) return null;
    return {
      email: parsed.email,
      issuedAt: typeof parsed.issuedAt === "number" ? parsed.issuedAt : 0,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

/** Server-component / route-handler helper: current admin session or null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const store = await cookies();
    return readAdminSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export function adminSessionCookieOptions(maxAge: number = ADMIN_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
