import type { Metadata } from "next";



import { LegalPage } from "../site-components";

export const metadata: Metadata = {
  title: "Privacy Policy · Owed",
  description: "How Owed handles your information and keeps your data local.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="Your data belongs to you."
      intro="Owed is built around a simple promise: your personal money records should remain personal."
    >
      <section>
        <h2>The short version</h2>
        <p>
          Owed stores the people, promises, payments, notes, and reminders you add locally on your
          device. You do not need an account, and Owed does not operate a cloud account service that
          receives this information.
        </p>
        <p>
          The only information Owed receives from you is what you choose to send: optional product
          feedback.
        </p>
      </section>

      <section>
        <h2>Information that stays on your device</h2>
        <p>
          Debt records, people, payment history, reminder settings, app lock credentials, contacts
          you choose while adding a person, and backups you create remain on your device by default.
          Owed does not upload that information to its servers.
        </p>
        <p>
          Owed does not use analytics, advertising SDKs, or third-party trackers. It does not
          collect bank details, advertising identifiers, or precise location.
        </p>
      </section>

      <section>
        <h2>Optional feedback</h2>
        <p>
          If you use Share feedback in the app or the feedback form on this website, Owed stores the
          message you send so the product can be improved. That may include:
        </p>
        <ul>
          <li>category, title, and description</li>
          <li>an email address, only if you choose to provide one</li>
          <li>
            basic device and app context such as platform, app version, build number, OS version,
            device model, and locale
          </li>
        </ul>
        <p>
          Feedback is optional and user-initiated. Please do not include private financial details.
          Feedback is used only to understand and respond to product issues or requests, not for
          advertising or tracking across other companies’ apps or websites.
        </p>
      </section>

      <section>
        <h2>Android waitlist</h2>
        <p>
          If you join the Android waitlist on this website, Owed stores the email address you
          provide so it can send a one-time notice when Google Play is available. That email is not
          used for marketing beyond that notice unless you ask otherwise later.
        </p>
      </section>

      <section>
        <h2>Contacts</h2>
        <p>
          If you grant contact access, Owed lets you choose a phone number while adding or editing a
          person. Contact access is optional, read-only, and used on your device. Owed does not
          upload your address book.
        </p>
      </section>

      <section>
        <h2>Notifications</h2>
        <p>
          If you enable reminders, Owed schedules notifications on your device using the dates you
          provide. These reminders are not messages to the other person and do not require Owed to
          receive your debt information.
        </p>
      </section>

      <section>
        <h2>Currency suggestions</h2>
        <p>
          When you change currency, Owed may briefly request a public exchange-rate suggestion from
          a third-party rate service to help fill in a conversion field. That request is only used
          to return a suggested rate in the moment. Your debt records are not sent with it.
        </p>
      </section>

      <section>
        <h2>Backups</h2>
        <p>
          You can create a backup file from the app. You decide where that file is saved or shared.
          Once a backup leaves Owed, the privacy and security of the destination you choose applies.
          Keep backup files somewhere you trust.
        </p>
      </section>

      <section>
        <h2>Device security and deletion</h2>
        <p>
          Your local data is protected by the security of your device. You can also enable the app
          lock where supported. Deleting app data or uninstalling Owed can remove locally stored
          records, so create a backup first if you want to keep them.
        </p>
        <p>
          To ask about deletion of optional feedback or waitlist email you previously submitted, use
          the <a href="/feedback">feedback form</a>.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Owed is a general utility and is not directed to children under 13. Owed does not
          knowingly collect personal information from children.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If Owed’s data practices change, this policy will be updated before the new practices take
          effect. A meaningful change will be explained clearly in the app or on this page.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          For privacy questions, use the <a href="/feedback">feedback form</a>. Please do not
          include private financial details.
        </p>
      </section>
    </LegalPage>
  );
}
