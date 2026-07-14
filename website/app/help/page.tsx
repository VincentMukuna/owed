import type { Metadata } from "next";
import { Footer, Header } from "../site-components";

export const metadata: Metadata = { title: "Help Center · Owed", description: "Answers and support for using Owed." };

const helpTopics = [
  ["Getting started", "Add a person, record a promise, and understand your home totals.", ["Open Owed and tap the plus button.", "Choose whether money is owed to you or by you.", "Add the amount, person, optional date, and note, then save."]],
  ["Recording a payment", "Keep partial and full payments attached to the right promise.", ["Open the promise from Debts or a person’s page.", "Choose Add payment and enter the amount and date.", "Owed updates the outstanding balance and payment history."]],
  ["Reminders", "Schedule private, on-device nudges for important dates.", ["Add or edit a due date on a promise.", "Enable its reminder and allow notifications when asked.", "The reminder appears on your device; the other person is never contacted."]],
  ["Backup and restore", "Move or protect your data with a backup file you control.", ["Open Settings and choose Backup & restore.", "Create a backup and save it somewhere you trust.", "To restore, choose the backup file from the same screen."]],
];

export default function HelpPage() {
  return (
    <><Header /><main className="help-main"><div className="container help-hero"><span className="eyebrow">Help center</span><h1>How can we help?</h1><p>Clear answers for the few things Owed asks you to think about.</p></div><div className="container help-topics">{helpTopics.map(([title, intro, steps]) => <article key={title as string}><span className="help-index">0{helpTopics.findIndex((topic) => topic[0] === title) + 1}</span><h2>{title as string}</h2><p>{intro as string}</p><ol>{(steps as string[]).map((step) => <li key={step}>{step}</li>)}</ol></article>)}</div><section className="container support-card"><div><span className="eyebrow light">Still stuck?</span><h2>Tell us what happened.</h2><p>Open a GitHub issue with your device model, operating-system version, and what you expected to happen. Please leave out names, amounts, and other private financial details.</p></div><a href="https://github.com/VincentMukuna/owed/issues/new">Open a support issue →</a></section><div className="container help-legal">Looking for the details? <a href="/privacy">Privacy policy</a> · <a href="/terms">Terms of service</a></div></main><Footer /></>
  );
}
