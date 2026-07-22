import type { Metadata } from "next";
import Link from "next/link";

import { listAndroidWaitlistSignups } from "../../actions/waitlist-admin";
import { isAdminAuthenticated } from "../../lib/waitlist-admin-auth";
import { WaitlistAdminLoginForm } from "./login-form";
import { WaitlistAdminPanel } from "./waitlist-admin-panel";

export const metadata: Metadata = {
  title: "Android waitlist admin · Owwed",
  robots: { index: false, follow: false },
};

export default async function AndroidWaitlistAdminPage() {
  const authenticated = await isAdminAuthenticated();
  const list = authenticated ? await listAndroidWaitlistSignups() : null;

  return (
    <main className="waitlist-admin-shell">
      <div className="container waitlist-admin-page">
        <div className="waitlist-admin-top">
          <Link className="waitlist-admin-brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              O
            </span>
            Owwed
          </Link>
        </div>

        <span className="eyebrow">
          <span className="status-dot" />
          Admin
        </span>
        <h1>Android waitlist.</h1>
        <p className="waitlist-admin-lede">
          Approve in Play Console, then email the closed-testing invite.
        </p>

        {!authenticated ? (
          <WaitlistAdminLoginForm />
        ) : list?.ok === false ? (
          <p className="android-submit-error" role="alert">
            {list.error}
          </p>
        ) : (
          <WaitlistAdminPanel rows={list?.rows ?? []} />
        )}
      </div>
    </main>
  );
}
