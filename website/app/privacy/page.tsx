import type { Metadata } from "next";
import { LegalPage } from "../site-components";

export const metadata: Metadata = { title: "Privacy Policy — Owed", description: "How Owed handles your information and keeps your data local." };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Privacy policy" title="Your data belongs to you." intro="Owed is built around a simple promise: your personal money records should remain personal.">
      <section><h2>The short version</h2><p>Owed stores the people, promises, payments, notes, categories, and reminders you add locally on your device. You do not need an account, and Owed does not operate a cloud account service that receives this information.</p></section>
      <section><h2>Information Owed does not collect</h2><p>Owed does not collect your name, email address, phone number, bank details, contacts, debt records, payment history, app usage, advertising identifiers, or precise location. Owed does not use analytics, advertising SDKs, or third-party trackers.</p></section>
      <section><h2>Contacts</h2><p>If you grant contact access, Owed lets you choose a phone number while adding or editing a person. Contact access is optional, read-only, and used on your device. Owed does not upload your address book.</p></section>
      <section><h2>Notifications</h2><p>If you enable reminders, Owed schedules notifications on your device using the dates you provide. These reminders are not messages to the other person and do not require Owed to receive your debt information.</p></section>
      <section><h2>Backups</h2><p>You can create a backup file from the app. You decide where that file is saved or shared. Once a backup leaves Owed, the privacy and security of the destination you choose applies. Keep backup files somewhere you trust.</p></section>
      <section><h2>Device security and deletion</h2><p>Your data is protected by the security of your device. You can also enable the app lock where supported. Deleting app data or uninstalling Owed can remove locally stored records, so create a backup first if you want to keep them.</p></section>
      <section><h2>Children</h2><p>Owed is a general utility and is not directed to children under 13. Because Owed does not operate user accounts or collect personal information, it does not knowingly collect information from children.</p></section>
      <section><h2>Changes</h2><p>If Owed’s data practices change, this policy will be updated before the new practices take effect. A meaningful change will be explained clearly in the app or on this page.</p></section>
      <section><h2>Questions</h2><p>For privacy questions, open an issue in the <a href="https://github.com/VincentMukuna/owed/issues">Owed support repository</a>. Do not include private financial details in a public issue.</p></section>
    </LegalPage>
  );
}
