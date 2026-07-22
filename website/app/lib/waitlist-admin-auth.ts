import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "owed_waitlist_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getSessionSecret() {
  const secret = process.env.WAITLIST_ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("WAITLIST_ADMIN_SESSION_SECRET is not configured.");
  }

  return secret;
}

function getAdminPassword() {
  const password = process.env.WAITLIST_ADMIN_PASSWORD;

  if (!password) {
    throw new Error("WAITLIST_ADMIN_PASSWORD is not configured.");
  }

  return password;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function verifyAdminPassword(password: string) {
  return safeEqual(password, getAdminPassword());
}

export async function createAdminSession() {
  const expiresAt = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const token = `${expiresAt}.${sign(expiresAt)}`;
  const jar = await cookies();

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const [expiresAt, signature] = token.split(".");

  if (!expiresAt || !signature) {
    return false;
  }

  const expected = sign(expiresAt);

  if (!safeEqual(signature, expected)) {
    return false;
  }

  const expiresMs = Number(expiresAt);

  if (!Number.isFinite(expiresMs) || Date.now() > expiresMs) {
    return false;
  }

  return true;
}
