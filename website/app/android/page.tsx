import type { Metadata } from "next";
import { Footer, Header } from "../site-components";
import { AndroidWaitlistForm } from "./android-waitlist-form";

export const metadata: Metadata = {
  title: "Android Waitlist · Owed",
  description:
    "Get notified when Owed launches on Google Play. Leave your email for a one-time Android release note.",
  alternates: { canonical: "/android" },
};

export default function AndroidPage() {
  return (
    <>
      <Header />
      <main className="simple-main">
        <div className="container simple-wrap">
          <span className="eyebrow">
            <span className="status-dot" />
            Android
          </span>
          <h1>Get notified for Google Play.</h1>
          <p>Leave your email and we’ll tell you when Owed is ready on Android.</p>
          <AndroidWaitlistForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
