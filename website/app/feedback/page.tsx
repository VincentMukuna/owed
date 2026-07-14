import type { Metadata } from "next";
import { Footer, Header } from "../site-components";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Send Feedback · Owed",
  description:
    "Share a bug, feature idea, or general note about Owed. Feedback is private and goes straight to the team.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <>
      <Header />
      <main className="simple-main">
        <div className="container simple-wrap">
          <span className="eyebrow">
            <span className="status-dot" />
            Feedback
          </span>
          <h1>Tell us what happened.</h1>
          <p>Bugs, ideas, and quiet notes all help. Keep money details out of your message.</p>
          <FeedbackForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
