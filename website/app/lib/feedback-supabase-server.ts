import {
  getFeedbackSupabaseConfig,
  getFeedbackSupabaseHeaders,
  getOwwedProductId,
  readSupabaseErrorMessage,
} from "./feedback-supabase";

export function getFeedbackServiceRoleKey() {
  const key = process.env.FEEDBACK_SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("Feedback service role key is not configured.");
  }

  return key;
}

export function getFeedbackServiceHeaders() {
  const key = getFeedbackServiceRoleKey();

  return {
    ...getFeedbackSupabaseHeaders(key),
    Authorization: `Bearer ${key}`,
  };
}

export { getFeedbackSupabaseConfig, getOwwedProductId, readSupabaseErrorMessage };
