import type { Metadata } from "next";
import { LegalPage } from "../site-components";

export const metadata: Metadata = { title: "Terms of Service · Owed", description: "The terms for using the Owed personal money tracker." };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Terms of service" title="Simple terms for a simple tool." intro="These terms explain what Owed is, what it is not, and the responsibilities that come with using it.">
      <section><h2>Using Owed</h2><p>You may use Owed to keep personal records of informal money promises, amounts, dates, notes, and payments. You are responsible for the information you enter and for keeping your device and backups secure.</p></section>
      <section><h2>Not a financial service</h2><p>Owed is a personal record-keeping utility. It is not a bank, lender, payment processor, collection agency, credit bureau, escrow service, or financial adviser. Owed does not verify a debt, move money, contact another person on your behalf, or make a record legally enforceable.</p></section>
      <section><h2>Your relationships and records</h2><p>You are responsible for resolving any disagreement about an amount, payment, due date, or person. Use Owed lawfully and respectfully. Do not use the app to threaten, harass, deceive, or misrepresent another person.</p></section>
      <section><h2>Availability and changes</h2><p>Owed may be updated, changed, suspended, or discontinued. Features may differ by device or operating system. Reasonable care is taken to keep the app reliable, but uninterrupted or error-free operation is not guaranteed.</p></section>
      <section><h2>Backups and data loss</h2><p>Owed stores data locally. You are responsible for creating backups you need and keeping them safe. To the fullest extent permitted by law, Owed is not responsible for records lost because of device loss, deletion, corruption, operating-system changes, or a backup destination you control.</p></section>
      <section><h2>No warranties</h2><p>Owed is provided “as is” and “as available,” without warranties beyond those that cannot be excluded by law. You should independently confirm important balances, dates, and payments.</p></section>
      <section><h2>Limitation of liability</h2><p>To the fullest extent permitted by law, Owed’s creator will not be liable for indirect, incidental, special, consequential, or punitive loss arising from your use of the app. Nothing in these terms limits rights or liability that the law does not allow to be limited.</p></section>
      <section><h2>Changes to these terms</h2><p>These terms may be updated as Owed changes. Material changes will be explained clearly, and the date at the top of this page will be updated.</p></section>
      <section><h2>Contact</h2><p>For questions about these terms, use the <a href="/feedback">feedback form</a>.</p></section>
    </LegalPage>
  );
}
