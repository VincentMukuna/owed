import Link from "next/link";
import { FiMoon, FiSun } from "react-icons/fi";
import { SiApple, SiGoogleplay } from "react-icons/si";

import { getStoreLinks, type StoreLink } from "./lib/store-links";
import { HeaderSurface } from "./header-surface";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg
        className="brand-mark-icon"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="56"
          y="40"
          width="400"
          height="432"
          rx="64"
          stroke="currentColor"
          strokeWidth="44"
        />
        <line
          x1="120"
          y1="152"
          x2="392"
          y2="152"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
        />
        <line
          x1="120"
          y1="248"
          x2="392"
          y2="248"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
        />
        <line
          x1="120"
          y1="344"
          x2="296"
          y2="344"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
        />
        <path
          d="M328 376 L364 416 L432 328"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Owwed home">
      <BrandMark />
      <span>Owwed</span>
    </Link>
  );
}

function StoreButton({ link }: { link: StoreLink }) {
  if (link.kind === "hidden") {
    return null;
  }

  if (link.kind === "waitlist") {
    return (
      <Link className="android-waitlist-link" href={link.href}>
        {link.kicker} {link.label} <span aria-hidden="true">→</span>
      </Link>
    );
  }

  const Icon = link.kind === "appStore" || link.kind === "testFlight" ? SiApple : SiGoogleplay;

  return (
    <a className="store-button" href={link.href}>
      <Icon className="store-icon" aria-hidden="true" />
      <span className="store-copy">
        <span className="store-kicker">{link.kicker}</span>
        <strong>{link.label}</strong>
      </span>
    </a>
  );
}

export function StoreButtons({ compact = false }: { compact?: boolean }) {
  const { ios, android } = getStoreLinks();
  const hasWaitlist = android.kind === "waitlist";

  return (
    <div
      className={`store-buttons${compact ? " compact" : ""}${hasWaitlist ? " has-waitlist" : ""}`}
    >
      <StoreButton link={ios} />
      <StoreButton link={android} />
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

function NavStoreCta({
  link,
  className,
}: {
  link: StoreLink;
  className?: string;
}) {
  if (link.kind === "hidden") {
    return null;
  }

  const classes = ["nav-cta", className].filter(Boolean).join(" ");

  if (link.kind === "waitlist") {
    return (
      <Link className={classes} href={link.href}>
        {link.navLabel}
      </Link>
    );
  }

  return (
    <a className={classes} href={link.href}>
      {link.navLabel}
    </a>
  );
}

export function Header() {
  const { ios, android } = getStoreLinks();
  const showIosCta = ios.kind !== "hidden";

  return (
    <HeaderSurface>
      <div className="container nav-shell">
        <Brand />
        <div className="nav-actions">
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/#privacy">Privacy</Link>
            <Link href="/help">Help</Link>
            {showIosCta ? <NavStoreCta className="nav-cta-ios" link={ios} /> : null}
            <NavStoreCta className="nav-cta-android" link={android} />
          </nav>
          {showIosCta ? (
            <NavStoreCta className="nav-cta-ios mobile-cta" link={ios} />
          ) : null}
          <NavStoreCta className="nav-cta-android mobile-cta" link={android} />
          <ThemeToggle />
        </div>
      </div>
    </HeaderSurface>
  );
}

export function Footer() {
  const { ios } = getStoreLinks();
  const showIosCta = ios.kind !== "hidden";

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>A private debt tracker for money between people.</p>
          <p className="crafted">
            Built with care by{" "}
            <a href="https://builtby.vin" rel="author">
              Vincent <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Product</strong>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#privacy">Privacy</Link>
            {showIosCta ? <a href={ios.href}>{ios.navLabel}</a> : null}
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
