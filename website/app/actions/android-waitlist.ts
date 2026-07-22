"use server";

import { after } from "next/server";

import {
  getFeedbackServiceHeaders,
  getFeedbackSupabaseConfig,
  getOwwedProductId,
  readSupabaseErrorMessage,
} from "../lib/feedback-supabase-server";
import { tryCatch } from "../lib/try-catch";
import {
  sendWaitlistJoinedAck,
  sendWaitlistJoinedNotify,
} from "../lib/waitlist-email";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const GENERIC_ERROR = "Something went wrong. Please try again.";

export type JoinAndroidWaitlistResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; error: string };

export async function joinAndroidWaitlist(email: string): Promise<JoinAndroidWaitlistResult> {
  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > 320) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const { data, error } = await tryCatch(insertWaitlistSignup(trimmed));

  if (error) {
    console.error("Waitlist signup failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }

  return data;
}

async function insertWaitlistSignup(email: string): Promise<JoinAndroidWaitlistResult> {
  const { supabaseUrl } = getFeedbackSupabaseConfig();
  const productId = await getOwwedProductId();

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
    method: "POST",
    headers: {
      ...getFeedbackServiceHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      product_id: productId,
      email,
      platform: "android",
      source: "website",
      status: "pending",
      metadata: { page: "/android" },
    }),
  });

  if (response.ok) {
    after(async () => {
      const { error } = await tryCatch(
        Promise.all([sendWaitlistJoinedAck(email), sendWaitlistJoinedNotify(email)]),
      );

      if (error) {
        console.error("Waitlist emails failed after signup:", error);
      }
    });

    return { ok: true, alreadyJoined: false };
  }

  const supabaseError = await readSupabaseErrorMessage(response, "Waitlist request");

  if (response.status === 409 || supabaseError.code === "23505") {
    return { ok: true, alreadyJoined: true };
  }

  console.error("Waitlist signup failed:", supabaseError.message, supabaseError.code);
  return { ok: false, error: GENERIC_ERROR };
}
