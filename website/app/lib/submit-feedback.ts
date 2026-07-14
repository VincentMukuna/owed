import {
  getFeedbackSupabaseConfig,
  getFeedbackSupabaseHeaders,
  getOwwedProductId,
  readSupabaseErrorMessage,
} from "./feedback-supabase";

export const feedbackCategories = [
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature_request" },
  { label: "General", value: "feedback" },
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number]["value"];

export type SubmitWebsiteFeedbackInput = {
  category: FeedbackCategory;
  title: string;
  description: string;
  email?: string;
};

export async function submitWebsiteFeedback(input: SubmitWebsiteFeedbackInput) {
  const { publishableKey, supabaseUrl } = getFeedbackSupabaseConfig();
  const productId = await getOwwedProductId();
  const locale = typeof navigator !== "undefined" ? navigator.language : undefined;

  const response = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
    method: "POST",
    headers: {
      ...getFeedbackSupabaseHeaders(publishableKey),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      product_id: productId,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      platform: "web",
      app_version: "website",
      build_number: "website",
      os_version: "web",
      device_model: "browser",
      email: input.email?.trim() ? input.email.trim().toLowerCase() : null,
      metadata: {
        locale,
        page: "/feedback",
        screen: "WebsiteFeedback",
      },
    }),
  });

  if (!response.ok) {
    throw new Error((await readSupabaseErrorMessage(response, "Feedback request")).message);
  }
}
