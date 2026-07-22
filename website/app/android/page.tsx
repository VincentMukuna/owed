import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getStoreLinks } from "../lib/store-links";
import { Footer, Header } from "../site-components";
import { AndroidWaitlistForm } from "./android-waitlist-form";

export const metadata: Metadata = {
  title: "Android Beta · Owwed",
  description:
    "Request an invite to the Owwed Android closed beta. Leave your email and we’ll follow up with a join link.",
  alternates: { canonical: "/android" },
};

export default function AndroidPage() {
  const { android } = getStoreLinks();

  if (android.kind === "playStore" || android.kind === "playBeta") {
    redirect(android.href);
  }

  return (
    <>
      <Header />
      <main className="simple-main">
        <div className="container simple-wrap">
          <span className="eyebrow">
            <span className="status-dot" />
            Android
          </span>
          <h1>Join the Android beta.</h1>
          <p>
            Leave your email. We’ll add you to closed testing, then send the Play Store invite.
          </p>
          <AndroidWaitlistForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
