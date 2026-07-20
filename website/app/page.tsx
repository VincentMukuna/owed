import type { Metadata } from "next";
import Image from "next/image";

import { getDownloadSectionCopy, getStoreLinks } from "./lib/store-links";
import { Footer, Header, StoreButtons } from "./site-components";

export const metadata: Metadata = {
  title: "Owwed: Private Debt Tracker for Friends & Family",
  description:
    "Keep track of money you owe and money owed to you in a private, local-first iPhone app. Try the free beta with no account required.",
};

const workflow = [
  {
    title: "See what is outstanding",
    text: "See who owes what and what you still need to pay, without piecing the story together.",
    note: "One calm overview",
  },
  {
    title: "Keep the full picture",
    text: "Amounts, payments, due dates, and remaining balances stay together from start to finish.",
    note: "A history you can trust",
  },
  {
    title: "Remember at the right time",
    text: "Set a private reminder on your phone and let Owwed hold the date for you.",
    note: "Quiet, useful reminders",
  },
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
  const storeLinks = getStoreLinks();
  const downloadCopy = getDownloadSectionCopy(storeLinks);
  const downloadUrl =
    storeLinks.ios.kind !== "hidden"
      ? storeLinks.ios.href
      : storeLinks.android.kind !== "waitlist"
        ? storeLinks.android.href
        : undefined;
  const operatingSystems = [
    storeLinks.ios.kind !== "hidden" ? "iOS" : null,
    storeLinks.android.kind === "playStore" || storeLinks.android.kind === "playBeta"
      ? "Android"
      : null,
  ].filter(Boolean);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Owwed",
    applicationCategory: "FinanceApplication",
    operatingSystem: operatingSystems.join(", ") || "iOS",
    description:
      "Keep track of money you owe and money owed to you in a private, local-first phone app.",
    ...(downloadUrl ? { downloadUrl } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-layout">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="status-dot" aria-hidden="true" /> Private by design
              </span>
              <h1>A simpler way to remember money.</h1>
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
            <div className="hero-showcase" aria-label="Owwed home screen on an iPhone">
              <span className="showcase-orbit orbit-one" aria-hidden="true" />
              <span className="showcase-orbit orbit-two" aria-hidden="true" />
              <div className="phone-frame hero-phone">
                <span className="face-id-blob" aria-hidden="true" />
                <Image
                  className="theme-image-light"
                  src="/screens/home.jpeg"
                  alt="Owwed home screen showing outstanding balances and upcoming debts"
                  width="473"
                  height="1024"
                  draggable={false}
                  fetchPriority="high"
                  sizes="(max-width: 640px) 68vw, 310px"
                />
                <Image
                  className="theme-image-dark"
                  src="/screens/home-dark.jpeg"
                  alt="Owwed home screen in dark mode showing outstanding balances and upcoming debts"
                  width="473"
                  height="1024"
                  draggable={false}
                  fetchPriority="high"
                  sizes="(max-width: 640px) 68vw, 310px"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="workflow-section" id="how-it-works" aria-labelledby="workflow-title">
          <div className="container workflow-layout">
            <div className="workflow-heading">
              <div>
                <p className="section-label">What Owwed does</p>
                <h2 id="workflow-title">Every money promise, in one place.</h2>
              </div>
              <p className="section-intro">
                Whether you covered dinner, lent a friend money, or need to pay someone back, Owwed
                keeps the details clear without making the relationship feel transactional.
              </p>
            </div>
            <ol className="workflow-list">
              {workflow.map(({ title, text, note }, index) => (
                <li key={title}>
                  <div className={`workflow-motif motif-${index + 1}`} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="workflow-number">0{index + 1}</span>
                  <div className="workflow-copy">
                    <p className="workflow-note">{note}</p>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="workflow-footnote">
              <span className="status-dot" aria-hidden="true" />
              Designed for the small, everyday money moments between people.
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
            <h2>{downloadCopy.title}</h2>
            <p>{downloadCopy.body}</p>
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
