import {
  getFeedbackSupabaseConfig,
  getFeedbackSupabaseHeaders,
  getOwwedProductId,
  readSupabaseErrorMessage,
} from "./feedback-supabase";

export async function submitAndroidWaitlistEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  const { publishableKey, supabaseUrl } = getFeedbackSupabaseConfig();
  const productId = await getOwwedProductId();

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
    method: "POST",
    headers: {
      ...getFeedbackSupabaseHeaders(publishableKey),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      product_id: productId,
      email: trimmed,
      platform: "android",
      source: "website",
      metadata: { page: "/android" },
    }),
  });

  if (response.ok) {
    return { alreadyJoined: false as const };
  }

  const error = await readSupabaseErrorMessage(response, "Waitlist request");

  if (response.status === 409 || error.code === "23505") {
    return { alreadyJoined: true as const };
  }

  throw new Error(error.message);
}
