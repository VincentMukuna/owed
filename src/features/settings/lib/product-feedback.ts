import { Platform } from "react-native";

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Localization from "expo-localization";

const FEEDBACK_PRODUCT_SLUG = "owwed";

export const feedbackCategories = [
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature_request" },
  { label: "General", value: "feedback" },
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number]["value"];

export type SubmitFeedbackInput = {
  category: FeedbackCategory;
  title: string;
  description: string;
  email?: string;
};

type ProductRow = {
  id: string;
};

let productIdPromise: Promise<string> | null = null;

function getFeedbackConfig() {
  const supabaseUrl = process.env.EXPO_PUBLIC_FEEDBACK_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_FEEDBACK_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Feedback is not configured yet.");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    publishableKey,
  };
}

function getFeedbackHeaders(publishableKey: string) {
  return {
    apikey: publishableKey,
    "Content-Type": "application/json",
  };
}

async function readErrorMessage(response: Response) {
  const fallback = `Feedback request failed (${response.status}).`;

  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function getFeedbackProductId() {
  if (productIdPromise) {
    return productIdPromise;
  }

  productIdPromise = (async () => {
    const { publishableKey, supabaseUrl } = getFeedbackConfig();
    const params = new URLSearchParams({
      select: "id",
      slug: `eq.${FEEDBACK_PRODUCT_SLUG}`,
      limit: "1",
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/products?${params.toString()}`, {
      headers: getFeedbackHeaders(publishableKey),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const products = (await response.json()) as ProductRow[];
    const productId = products.at(0)?.id;

    if (!productId) {
      throw new Error("Feedback product is not available yet.");
    }

    return productId;
  })();

  return productIdPromise;
}

export async function submitProductFeedback(input: SubmitFeedbackInput) {
  const { publishableKey, supabaseUrl } = getFeedbackConfig();
  const productId = await getFeedbackProductId();
  const locale = Localization.getLocales().at(0)?.languageTag;

  const response = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
    method: "POST",
    headers: {
      ...getFeedbackHeaders(publishableKey),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      product_id: productId,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "unknown",
      build_number: Constants.nativeBuildVersion ?? "unknown",
      os_version: Device.osVersion ?? "unknown",
      device_model: Device.modelName ?? Device.deviceName ?? "unknown",
      email: input.email?.trim() ? input.email.trim() : null,
      metadata: {
        locale,
        screen: "ShareFeedback",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}
