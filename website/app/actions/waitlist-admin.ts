"use server";

import { revalidatePath } from "next/cache";

import {
  getFeedbackServiceHeaders,
  getFeedbackSupabaseConfig,
  getOwwedProductId,
  readSupabaseErrorMessage,
} from "../lib/feedback-supabase-server";
import { tryCatch } from "../lib/try-catch";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "../lib/waitlist-admin-auth";
import { sendAndroidBetaInvite } from "../lib/waitlist-email";

export type WaitlistAdminRow = {
  id: string;
  email: string;
  status: "pending" | "invited";
  createdAt: string;
  invitedAt: string | null;
};

type WaitlistSignupRow = {
  id: string;
  email: string;
  status: "pending" | "invited";
  created_at: string;
  invited_at: string | null;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";
const LOAD_ERROR = "Failed to load waitlist.";
const SEND_ERROR = "Failed to send invite.";

export async function loginWaitlistAdmin(password: string) {
  const { data, error } = await tryCatch(authenticateAdmin(password));

  if (error) {
    console.error("Waitlist admin login failed:", error);
    return { ok: false as const, error: GENERIC_ERROR };
  }

  return data;
}

async function authenticateAdmin(password: string) {
  if (!verifyAdminPassword(password)) {
    return { ok: false as const, error: "Incorrect password." };
  }

  await createAdminSession();
  revalidatePath("/admin/android-waitlist");
  return { ok: true as const };
}

export async function logoutWaitlistAdmin() {
  await clearAdminSession();
  revalidatePath("/admin/android-waitlist");
}

export async function listAndroidWaitlistSignups(): Promise<
  | { ok: true; rows: WaitlistAdminRow[] }
  | { ok: false; error: string }
> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, error: "Unauthorized." };
  }

  const { data, error } = await tryCatch(fetchAndroidWaitlistSignups());

  if (error) {
    console.error("Waitlist list failed:", error);
    return { ok: false, error: LOAD_ERROR };
  }

  return data;
}

async function fetchAndroidWaitlistSignups(): Promise<
  { ok: true; rows: WaitlistAdminRow[] } | { ok: false; error: string }
> {
  const { supabaseUrl } = getFeedbackSupabaseConfig();
  const productId = await getOwwedProductId();
  const params = new URLSearchParams({
    select: "id,email,status,created_at,invited_at",
    product_id: `eq.${productId}`,
    platform: "eq.android",
    order: "created_at.desc",
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups?${params}`, {
    headers: getFeedbackServiceHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await readSupabaseErrorMessage(response, "Waitlist list");
    console.error("Waitlist list failed:", error.message, error.code);
    return { ok: false, error: LOAD_ERROR };
  }

  const rows = (await response.json()) as WaitlistSignupRow[];

  return {
    ok: true,
    rows: rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: row.status,
      createdAt: row.created_at,
      invitedAt: row.invited_at,
    })),
  };
}

export async function sendAndroidWaitlistInvite(signupId: string) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const { data, error } = await tryCatch(sendInviteForSignup(signupId));

  if (error) {
    console.error("Waitlist invite send failed:", error);
    return { ok: false as const, error: SEND_ERROR };
  }

  return data;
}

async function sendInviteForSignup(signupId: string) {
  const { supabaseUrl } = getFeedbackSupabaseConfig();
  const productId = await getOwwedProductId();
  const params = new URLSearchParams({
    select: "id,email,status",
    id: `eq.${signupId}`,
    product_id: `eq.${productId}`,
    platform: "eq.android",
    limit: "1",
  });

  const lookup = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups?${params}`, {
    headers: getFeedbackServiceHeaders(),
    cache: "no-store",
  });

  if (!lookup.ok) {
    const error = await readSupabaseErrorMessage(lookup, "Waitlist lookup");
    console.error("Waitlist invite lookup failed:", error.message, error.code);
    return { ok: false as const, error: SEND_ERROR };
  }

  const rows = (await lookup.json()) as Array<{
    id: string;
    email: string;
    status: "pending" | "invited";
  }>;
  const signup = rows.at(0);

  if (!signup) {
    return { ok: false as const, error: "Signup not found." };
  }

  if (signup.status === "invited") {
    return { ok: false as const, error: "Invite already sent." };
  }

  await sendAndroidBetaInvite(signup.email);

  const update = await fetch(
    `${supabaseUrl}/rest/v1/waitlist_signups?id=eq.${encodeURIComponent(signup.id)}`,
    {
      method: "PATCH",
      headers: {
        ...getFeedbackServiceHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "invited",
        invited_at: new Date().toISOString(),
      }),
    },
  );

  if (!update.ok) {
    const error = await readSupabaseErrorMessage(update, "Waitlist update");
    console.error("Waitlist invite update failed:", error.message, error.code);
    return { ok: false as const, error: SEND_ERROR };
  }

  revalidatePath("/admin/android-waitlist");
  return { ok: true as const };
}
