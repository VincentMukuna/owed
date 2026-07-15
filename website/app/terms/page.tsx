import type { Metadata } from "next";
import { LegalPage } from "../site-components";

export const metadata: Metadata = {
  title: "Terms of Service · Owwed",
  description: "The terms that govern use of Owwed.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern your access to and use of Owwed. By using Owwed, you agree to these terms."
    >
      <section>
        <h2>Use of Owwed</h2>
        <p>
          You may use Owwed to keep personal records of informal money promises, amounts, dates,
          notes, and payments. You are responsible for the information you enter and for securing
          your device and backups.
        </p>
      </section>

      <section>
        <h2>Not a financial service</h2>
        <p>
          Owwed is a personal record-keeping utility. It is not a bank, lender, payment processor,
          collection agency, credit bureau, escrow service, or financial adviser. Owwed does not
          verify debts, transfer money, contact another person on your behalf, or make a record
          legally enforceable.
        </p>
      </section>

      <section>
        <h2>Your responsibilities</h2>
        <p>
          You are responsible for resolving disputes about amounts, payments, due dates, or people.
          You must use Owwed lawfully and must not use it to threaten, harass, deceive, or
          misrepresent another person.
        </p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          Owwed may be updated, changed, suspended, or discontinued. Features may differ by device
          or operating system. Uninterrupted or error-free operation is not guaranteed.
        </p>
      </section>

      <section>
        <h2>Backups and data loss</h2>
        <p>
          Owwed stores data locally. You are responsible for creating and securing any backups you
          require. To the fullest extent permitted by law, Owwed is not responsible for records lost
          because of device loss, deletion, corruption, operating-system changes, or a backup
          destination you control.
        </p>
      </section>

      <section>
        <h2>Disclaimer of warranties</h2>
        <p>
          Owwed is provided “as is” and “as available,” without warranties beyond those that cannot
          be excluded by law. You should independently verify important balances, dates, and
          payments.
        </p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Owwed’s creator will not be liable for indirect,
          incidental, special, consequential, or punitive loss arising from your use of Owwed.
          Nothing in these terms limits rights or liability that cannot be limited by law.
        </p>
      </section>

      <section>
        <h2>Changes to these terms</h2>
        <p>
          These terms may be updated when Owwed changes. Material changes will be disclosed, and the
          date at the top of this page will be updated.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Submit questions about these terms through the <a href="/feedback">feedback form</a>.
        </p>
      </section>
    </LegalPage>
  );
}
