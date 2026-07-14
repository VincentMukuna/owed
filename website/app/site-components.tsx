import { FiMoon, FiSun } from "react-icons/fi";
import { SiApple } from "react-icons/si";








export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Owed home">
      <span className="brand-mark" aria-hidden="true">O</span>
      <span>Owed</span>
    </a>
  );
}

export function StoreButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`store-buttons${compact ? " compact" : ""}`}>
      <span className="store-button" role="link" aria-disabled="true">
        <SiApple className="store-icon" aria-hidden="true" />
        <span className="store-copy">
          <span className="store-kicker">Coming soon on the</span>
          <strong>App Store</strong>
        </span>
      </span>
      <span className="store-button secondary" role="link" aria-disabled="true">
        <span className="google-play-icon" aria-hidden="true" />
        <span className="store-copy">
          <span className="store-kicker">Coming soon on</span>
          <strong>Google Play</strong>
        </span>
      </span>
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
            <a href="/#features">Features</a>
            <a href="/#privacy">Privacy</a>
            <a href="/help">Help</a>
            <a className="nav-cta" href="/#download">Download</a>
          </nav>
          <ThemeToggle />
          <details className="mobile-menu">
            <summary aria-label="Open navigation"><span></span><span></span></summary>
            <nav aria-label="Mobile navigation">
              <a href="/#features">Features</a>
              <a href="/#privacy">Privacy</a>
              <a href="/help">Help</a>
              <a href="/#download">Download</a>
            </nav>
          </details>
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
          <p>A private place to remember money between people.</p>
          <p className="crafted">Built with care by Vincent.</p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Product</strong>
            <a href="/#features">Features</a>
            <a href="/#privacy">Privacy</a>
            <a href="/#download">Download</a>
          </div>
          <div>
            <strong>Resources</strong>
            <a href="/help">Help center</a>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of service</a>
            <a href="https://github.com/VincentMukuna/owed">GitHub</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Owed</span>
        <span>Made for real life, not the cloud.</span>
      </div>
    </footer>
  );
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
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
            <span className="eyebrow">{eyebrow}</span>
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
