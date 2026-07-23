import { NextResponse } from "next/server";

/** No-UI hop so invite emails can link to our domain (Resend domain-match). */
export function GET() {
  const playUrl = process.env.WAITLIST_ANDROID_INVITE_URL?.trim();

  if (!playUrl) {
    return NextResponse.redirect(new URL("/android", getSiteOrigin()), 302);
  }

  return NextResponse.redirect(playUrl, 302);
}

function getSiteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return "http://localhost:3000";
}
