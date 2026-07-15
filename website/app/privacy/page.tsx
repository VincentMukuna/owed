import type { Metadata } from "next";

import { LegalPage } from "../site-components";

export const metadata: Metadata = {
  title: "Privacy Policy · Owwed",
  description: "How Owwed collects, uses, stores, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what information Owwed processes, where it is stored, and the choices available to you."
    >
      <section>
        <h2>Information stored on your device</h2>
        <p>
          Owwed stores debt records, people, payment history, notes, reminder settings, app lock
          credentials, selected contact information, and backups locally on your device by default.
          Owwed does not operate a cloud account service or upload this information to its servers.
        </p>
        <p>
          Owwed does not use analytics, advertising SDKs, or third-party trackers. It does not
          collect bank details, advertising identifiers, or precise location.
        </p>
      </section>

      <section>
        <h2>Information you submit</h2>
        <p>
          If you submit feedback through the app or website, Owwed stores the category, title,
          description, and any email address you choose to provide. The submission may also include
          basic device and app information, including platform, app version, build number, operating
          system version, device model, and locale.
        </p>
        <p>
          Feedback is optional and is used to review and respond to product issues or requests. It
          is not used for advertising or cross-service tracking. Do not include private financial
          information in a feedback submission.
        </p>
        <p>
          If you join the Android waitlist, Owwed stores the email address you provide and uses it to
          send a notice when the app becomes available on Google Play. The address is not used for
          other marketing unless you later provide consent.
        </p>
      </section>

      <section>
        <h2>Device permissions</h2>
        <p>
          Contact access is optional and read-only. If granted, it is used on your device to select
          a phone number while adding or editing a person. Owwed does not upload your address book.
        </p>
        <p>
          If you enable reminders, Owwed uses the dates you provide to schedule notifications on
          your device. These notifications are not sent to other people, and Owwed does not receive
          your debt information to provide them.
        </p>
      </section>

      <section>
        <h2>External services</h2>
        <p>
          When you change currency, Owwed may request a public exchange-rate suggestion from a
          third-party rate service. The request is used to return a suggested rate and does not
          include your debt records.
        </p>
      </section>

      <section>
        <h2>Backups, security, and deletion</h2>
        <p>
          Backup files are created locally. You choose where they are saved or shared. After a
          backup leaves Owwed, it is subject to the privacy and security practices of the destination
          you select.
        </p>
        <p>
          Local data is protected by your device security and, where supported and enabled, the
          Owwed app lock. Deleting app data or uninstalling Owwed may permanently remove locally
          stored records.
        </p>
        <p>
          To request deletion of feedback or a waitlist email you submitted, use the{" "}
          <a href="/feedback">feedback form</a>.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Owwed is not directed to children under 13 and does not knowingly collect personal
          information from children under 13.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          This policy may be updated when Owwed’s data practices change. Material changes will be
          disclosed in the app or on this page before they take effect.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Submit privacy questions through the <a href="/feedback">feedback form</a>. Do not include
          private financial information.
        </p>
      </section>
    </LegalPage>
  );
}
