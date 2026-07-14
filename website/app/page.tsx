import type { Metadata } from "next";
import type { IconType } from "react-icons";
import { FiClock, FiDollarSign, FiLock, FiSmartphone } from "react-icons/fi";

import { Footer, Header, StoreButtons } from "./site-components";

export const metadata: Metadata = {
  title: "Owed: Private Debt Tracker for Friends & Family",
  description: "Track money you’ve lent, money you owe, payments, reminders, and due dates in one private, local-first app. Free, with no account required.",
};

const productScreens = [
  { image: "/screens/home.jpeg", darkImage: "/screens/home-dark.jpeg", title: "Home", text: "See everything unsettled at a glance." },
  { image: "/screens/debts.jpeg", darkImage: "/screens/debts-dark.jpeg", title: "Debts", text: "Keep every promise, due date, and balance together." },
  { image: "/screens/people.jpeg", darkImage: "/screens/people-dark.jpeg", title: "People", text: "View every promise grouped by person." },
  { image: "/screens/reminders.jpeg", darkImage: "/screens/reminders-dark.jpeg", title: "Reminders", text: "Know what is due without keeping it in your head." },
];

const features: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FiDollarSign,
    title: "Keep track of every promise",
    text: "Track money people owe you, money you owe them, payments, and due dates in one place.",
  },
  {
    icon: FiClock,
    title: "Never forget what happened",
    text: "See payment history, reminders, and remaining balances at a glance.",
  },
  {
    icon: FiLock,
    title: "Private by default",
    text: "App Lock, local-first storage, and backups when you choose.",
  },
  {
    icon: FiSmartphone,
    title: "Works wherever you are",
    text: "No account required. Works offline from the moment you install it.",
  },
];

const faqs = [
  [
    "What is Owed?",
    "Owed is a private app for recording money you’ve lent and money you owe. It keeps amounts, due dates, payments, reminders, and people together on your device.",
  ],
  [
    "Does Owed send money or split bills?",
    "No. Owed records informal money promises; it doesn’t move money, connect to a bank, or contact anyone on your behalf.",
  ],
  ["Is Owed free?", "Yes. Owed has no subscriptions and no ads."],
  [
    "Does it require an account?",
    "No. You can start immediately without creating an account or sharing an email address.",
  ],
  [
    "Does Owed upload my data?",
    "No. Your debts, people, and payments stay on your device by default.",
  ],
  [
    "Can I back up my data?",
    "Yes. You can create and restore a backup yourself. Owed never uploads a backup unless you explicitly choose where to save or share it.",
  ],
  [
    "Can I track money I owe?",
    "Yes. Each promise can be for money owed to you or money you owe someone else.",
  ],
  [
    "How do reminders work?",
    "Reminders are scheduled on your device. They help you remember due dates without sending messages to the other person.",
  ],
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Owed",
    applicationCategory: "FinanceApplication",
    operatingSystem: "iOS, Android",
    description:
      "Track money you’ve lent, money you owe, payments, reminders, and due dates in one private, local-first app. Free, with no account required.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-copy">
            <span className="eyebrow">
              <span className="status-dot"></span> Private by design
            </span>
            <h1>
              A simpler way
              <br />
              to remember money.
            </h1>
            <p>
              Track money you’ve lent, money you owe, payments, reminders, and due dates, all in one
              private place.
            </p>
            <div className="hero-cta">
              <StoreButtons />
              <p className="hero-note">
                Built for friends, family, roommates, and everyday life. Local-first and free.
              </p>
            </div>
          </div>
          <div className="container hero-visual" aria-label="Owed app shown on three phones">
            <img
              className="theme-image-light"
              src="/screens/hero.png"
              alt="The Owed home, debts, and people screens on three phones"
            />
            <img
              className="theme-image-dark"
              src="/screens/hero-dark.png"
              alt="The Owed home, debts, and people screens in dark mode on three phones"
            />
          </div>
        </section>

        <section className="screen-story" aria-labelledby="screens-title">
          <div className="container section-heading split-heading">
            <div>
              <span className="eyebrow">What Owed does</span>
              <h2 id="screens-title">
                Every money promise,
                <br />
                in one place.
              </h2>
            </div>
            <p>
              Whether you covered dinner, lent money to a friend, or still need to pay someone back,
              Owed shows what’s outstanding and what’s already been paid.
            </p>
          </div>
          <div className="container screen-grid">
            {productScreens.map((screen, index) => (
              <article className={`screen-card screen-${index + 1}`} key={screen.title}>
                <div className="screen-copy">
                  <span>0{index + 1}</span>
                  <h3>{screen.title}</h3>
                  <p>{screen.text}</p>
                </div>
                <div className="phone-frame">
                  <span className="face-id-blob" aria-hidden="true" />
                  <img
                    className="theme-image-light"
                    src={screen.image}
                    alt={`${screen.title} screen in the Owed app`}
                    loading="lazy"
                  />
                  <img
                    className="theme-image-dark"
                    src={screen.darkImage}
                    alt={`${screen.title} screen in the Owed app in dark mode`}
                    loading="lazy"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="why-section" id="features" aria-labelledby="why-title">
          <div className="container section-heading centered">
            <span className="eyebrow">Why Owed</span>
            <h2 id="why-title">Made to be quietly useful.</h2>
            <p>
              No ecosystem to join. No dashboard to maintain. Just a reliable place to remember.
            </p>
          </div>
          <div className="container three-up">
            <article>
              <span className="big-number">01</span>
              <h3>Local-first</h3>
              <p>Your data stays on your device, where it belongs.</p>
            </article>
            <article>
              <span className="big-number">02</span>
              <h3>No account</h3>
              <p>Open the app and start. There is no sign-up in the way.</p>
            </article>
            <article>
              <span className="big-number">03</span>
              <h3>Free</h3>
              <p>No subscriptions, no ads, and no unnecessary complexity.</p>
            </article>
          </div>
        </section>

        <section className="philosophy-section">
          <div className="container philosophy-grid">
            <div className="philosophy-copy">
              <span className="eyebrow light">The idea</span>
              <h2>Built for real life.</h2>
              <p>
                Money between friends and family shouldn’t require spreadsheets, complicated finance
                apps, or accounts.
              </p>
              <p>Track what matters, stay organized, and move on with your day.</p>
            </div>
            <div className="dark-phone-wrap">
              <span className="face-id-blob" aria-hidden="true" />
              <img
                src="/screens/home-dark.jpeg"
                alt="Owed home screen in dark mode"
                loading="lazy"
              />
              <div className="floating-note">
                <span></span>Your day stays yours.
              </div>
            </div>
          </div>
        </section>

        <section className="privacy-section" id="privacy" aria-labelledby="privacy-title">
          <div className="container privacy-intro">
            <span className="eyebrow">Privacy</span>
            <h2 id="privacy-title">Your data belongs to you.</h2>
            <p>
              Owed stores your information on your device by default. No account, bank connection,
              tracking, or cloud storage is required. You choose if and when to create a backup.
            </p>
          </div>
          <div className="container privacy-list">
            {[
              "Local-first",
              "No account required",
              "No tracking",
              "No ads",
              "No bank connections",
              "No cloud required",
            ].map((item, index) => (
              <div className="privacy-row" key={item}>
                <span>0{index + 1}</span>
                <strong>{item}</strong>
                <span className="check" aria-hidden="true">
                  ✓
                </span>
              </div>
            ))}
          </div>
          <div className="container privacy-link">
            <a href="/privacy">
              Read the plain-language privacy policy <span>→</span>
            </a>
          </div>
        </section>

        <section className="features-section" aria-labelledby="features-title">
          <div className="container features-layout">
            <div className="feature-grid">
              {features.map(({ icon: Icon, title, text }) => (
                <article className="feature-item" key={title}>
                  <span className="feature-icon-wrap">
                    <Icon className="feature-icon" aria-hidden="true" />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="features-copy">
              <span className="eyebrow">Details</span>
              <h2 id="features-title">
                Built around one,
                <br />
                simple idea.
              </h2>
              <p>Owed focuses on one job: helping you remember money between people.</p>
            </div>
          </div>
        </section>

        <section className="faq-section" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="faq-copy">
              <span className="eyebrow">FAQ</span>
              <h2 id="faq-title">A few honest answers.</h2>
              <p>Still wondering about something? The help center goes a little deeper.</p>
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

        <section className="download-section" id="download">
          <div className="container download-card">
            <span className="eyebrow light">Get Owed</span>
            <h2>
              Ready to get it
              <br />
              out of your head?
            </h2>
            <p>Owed is on the App Store soon. Join the Android waitlist.</p>
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
