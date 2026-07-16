import Link from "next/link";
import { FiMoon, FiSun } from "react-icons/fi";
import { SiApple } from "react-icons/si";

const IOS_BETA_URL = "https://testflight.apple.com/join/B16wcXJ5";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Owwed home">
      <span className="brand-mark" aria-hidden="true">
        O
      </span>
      <span>Owwed</span>
    </Link>
  );
}

export function StoreButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`store-buttons${compact ? " compact" : ""}`}>
      <a className="store-button" href={IOS_BETA_URL}>
        <SiApple className="store-icon" aria-hidden="true" />
        <span className="store-copy">
          <span className="store-kicker">Try the iOS beta</span>
          <strong>TestFlight</strong>
        </span>
      </a>
      <Link className="android-waitlist-link" href="/android">
        On Android? Join the waitlist <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function ThemeToggle() {
  return (
    <button
      suppressHydrationWarning
      className="theme-toggle"
      type="button"
      data-theme-toggle
      aria-label="Switch to dark mode"
      aria-pressed="false"
    >
      <FiSun className="theme-icon theme-sun" aria-hidden="true" />
      <FiMoon className="theme-icon theme-moon" aria-hidden="true" />
      <span className="sr-only">Toggle color theme</span>
    </button>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Brand />
        <div className="nav-actions">
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/#privacy">Privacy</Link>
            <Link href="/help">Help</Link>
            <a className="nav-cta" href={IOS_BETA_URL}>
              Try iOS beta
            </a>
          </nav>
          <a className="nav-cta mobile-cta" href={IOS_BETA_URL}>
            Try iOS beta
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>A private debt tracker for money between people.</p>
          <p className="crafted">Built with care by Vincent.</p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Product</strong>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#privacy">Privacy</Link>
            <a href={IOS_BETA_URL}>Try iOS beta</a>
          </div>
          <div>
            <strong>Resources</strong>
            <Link href="/help">Help center</Link>
            <Link href="/feedback">Send feedback</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of service</Link>
            <a href="https://github.com/VincentMukuna/owed">GitHub</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Owwed</span>
      </div>
    </footer>
  );
}

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="legal-main">
        <div className="container legal-wrap">
          <header className="legal-hero">
            <h1>{title}</h1>
            <p>{intro}</p>
            <time dateTime="2026-07-14">Last updated July 14, 2026</time>
          </header>
          <article className="legal-content">{children}</article>
        </div>
      </main>
      <Footer />
    </>
  );
}
