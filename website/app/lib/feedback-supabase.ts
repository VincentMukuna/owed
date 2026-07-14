const PRODUCT_SLUG = "owwed";

type ProductRow = {
  id: string;
};

let productIdPromise: Promise<string> | null = null;

export function getFeedbackSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_FEEDBACK_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_FEEDBACK_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Feedback is not configured yet.");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    publishableKey,
  };
}

export function getFeedbackSupabaseHeaders(publishableKey: string) {
  return {
    apikey: publishableKey,
    "Content-Type": "application/json",
  };
}

export async function readSupabaseErrorMessage(response: Response, fallbackLabel: string) {
  const fallback = `${fallbackLabel} failed (${response.status}).`;

  try {
    const body = (await response.json()) as { message?: string; error?: string; code?: string };
    return {
      message: body.message ?? body.error ?? fallback,
      code: body.code,
    };
  } catch {
    return { message: fallback };
  }
}

export async function getOwwedProductId() {
  if (productIdPromise) {
    return productIdPromise;
  }

  productIdPromise = (async () => {
    const { publishableKey, supabaseUrl } = getFeedbackSupabaseConfig();
    const params = new URLSearchParams({
      select: "id",
      slug: `eq.${PRODUCT_SLUG}`,
      limit: "1",
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/products?${params.toString()}`, {
      headers: getFeedbackSupabaseHeaders(publishableKey),
    });

    if (!response.ok) {
      throw new Error((await readSupabaseErrorMessage(response, "Product lookup")).message);
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
