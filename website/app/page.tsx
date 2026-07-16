import type { Metadata } from "next";
import Image from "next/image";

import { Footer, Header, StoreButtons } from "./site-components";

export const metadata: Metadata = {
  title: "Owwed: Private Debt Tracker for Friends & Family",
  description:
    "Keep track of money you owe and money owed to you in a private, local-first iPhone app. Try the free beta with no account required.",
};

const workflow = [
  ["See what is outstanding", "See who owes what and what you still need to pay."],
  ["Keep the full picture", "Save the amount, payments, due date, and remaining balance together."],
  [
    "Get a reminder when you need it",
    "Set reminders on your phone so you do not have to remember every date.",
  ],
];

const faqs = [
  [
    "What is Owwed?",
    "Owwed is a private app for recording money you’ve lent and money you owe. It keeps balances, payments, due dates, and reminders together.",
  ],
  [
    "Does it move money?",
    "No. Owwed records informal debts. It doesn’t connect to a bank, send money, or contact anyone on your behalf.",
  ],
  ["Is it free?", "Yes. The beta is free, with no subscriptions or ads."],
  [
    "Where is my data stored?",
    "Your debts, people, and payments stay on your device by default. You can create a backup yourself whenever you choose.",
  ],
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Owwed",
    applicationCategory: "FinanceApplication",
    operatingSystem: "iOS",
    description:
      "Keep track of money you owe and money owed to you in a private, local-first iPhone app.",
    downloadUrl: "https://testflight.apple.com/join/B16wcXJ5",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-copy">
            <span className="eyebrow">
              <span className="status-dot" aria-hidden="true" /> Private by design
            </span>
            <h1>
              A simpler way
              <br />
              to remember money.
            </h1>
            <p className="hero-summary">
              Keep track of money you have lent, borrowed, and paid back without digging through
              messages, notes, or spreadsheets.
            </p>
            <div className="hero-cta">
              <StoreButtons />
            </div>
            <ul className="hero-trust" aria-label="Owwed benefits">
              <li>Free beta</li>
              <li>No account</li>
              <li>Data stays on your device</li>
            </ul>
          </div>
          <div className="container hero-visual" aria-label="Owwed shown on three phones">
            <Image
              className="theme-image-light"
              src="/screens/hero.png"
              alt="The Owwed home, debts, and people screens on three phones"
              width="1920"
              height="1440"
              fetchPriority="high"
              sizes="(max-width: 1180px) 100vw, 1180px"
            />
            <Image
              className="theme-image-dark"
              src="/screens/hero-dark.png"
              alt="The Owwed home, debts, and people screens in dark mode on three phones"
              width="1920"
              height="1440"
              fetchPriority="high"
              sizes="(max-width: 1180px) 100vw, 1180px"
            />
          </div>
        </section>

        <section className="workflow-section" id="how-it-works" aria-labelledby="workflow-title">
          <div className="container workflow-layout">
            <div>
              <p className="section-label">What Owwed does</p>
              <h2 id="workflow-title">Every money promise, in one place.</h2>
              <p className="section-intro">
                Whether you covered dinner, lent a friend money, or need to pay someone back, Owwed
                shows what is still outstanding and what has already been paid.
              </p>
              <ol className="workflow-list">
                {workflow.map(([title, text]) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="phone-frame workflow-phone">
              <span className="face-id-blob" aria-hidden="true" />
              <Image
                className="theme-image-light"
                src="/screens/home.jpeg"
                alt="Owwed home screen showing outstanding balances and upcoming debts"
                width="473"
                height="1024"
                sizes="(max-width: 640px) 72vw, 326px"
              />
              <Image
                className="theme-image-dark"
                src="/screens/home-dark.jpeg"
                alt="Owwed home screen in dark mode showing outstanding balances and upcoming debts"
                width="473"
                height="1024"
                sizes="(max-width: 640px) 72vw, 326px"
              />
            </div>
          </div>
        </section>

        <section className="trust-section" id="privacy" aria-labelledby="trust-title">
          <div className="container trust-layout">
            <div className="trust-copy">
              <p className="section-label section-label-light">Private by default</p>
              <h2 id="trust-title">Your data stays with you.</h2>
              <p>
                Owwed does not need an account or a cloud service. Your data stays on your phone
                unless you choose to create a backup.
              </p>
              <a href="/privacy">Read the plain-language privacy policy →</a>
            </div>
            <ul className="trust-list">
              <li>
                <strong>Local-first</strong>
                <span>Debts, people, and payments are stored on your device.</span>
              </li>
              <li>
                <strong>No account</strong>
                <span>Download it and start keeping track.</span>
              </li>
              <li>
                <strong>Works offline</strong>
                <span>Your records remain available without a connection.</span>
              </li>
              <li>
                <strong>Backups are your choice</strong>
                <span>Make and save a backup when you need one.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="faq-section" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="faq-copy">
              <p className="section-label">Questions</p>
              <h2 id="faq-title">A few things you might want to know.</h2>
              <p>There is more detail in the help center if you need it.</p>
              <a href="/help">Visit the help center →</a>
            </div>
            <div className="faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="download-section" id="try-owed">
          <div className="container download-card">
            <p className="section-label section-label-light">Get Owwed</p>
            <h2>Try Owwed on iPhone.</h2>
            <p>The beta is available now through TestFlight. No account needed.</p>
            <StoreButtons compact />
          </div>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
