"use server";

import {
  getFeedbackServiceHeaders,
  getFeedbackSupabaseConfig,
  getOwwedProductId,
  readSupabaseErrorMessage,
} from "../lib/feedback-supabase-server";
import {
  sendWaitlistJoinedAck,
  sendWaitlistJoinedNotify,
} from "../lib/waitlist-email";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export type JoinAndroidWaitlistResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; error: string };

export async function joinAndroidWaitlist(email: string): Promise<JoinAndroidWaitlistResult> {
  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > 320) {
    return { ok: false, error: "Enter a valid email address." };
  }

  try {
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
        email: trimmed,
        platform: "android",
        source: "website",
        status: "pending",
        metadata: { page: "/android" },
      }),
    });

    if (response.ok) {
      try {
        await Promise.all([
          sendWaitlistJoinedAck(trimmed),
          sendWaitlistJoinedNotify(trimmed),
        ]);
      } catch (emailError) {
        console.error("Waitlist emails failed after signup:", emailError);
      }

      return { ok: true, alreadyJoined: false };
    }

    const error = await readSupabaseErrorMessage(response, "Waitlist request");

    if (response.status === 409 || error.code === "23505") {
      return { ok: true, alreadyJoined: true };
    }

    return { ok: false, error: error.message };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong. Please try again.",
    };
  }
}
