import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

const themeBootScript = `(function(){try{var saved=localStorage.getItem('owed-theme');var dark=saved?saved==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=dark?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`;

const themeControlsScript = `(function(){var media=window.matchMedia('(prefers-color-scheme: dark)');function apply(theme){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(function(button){var dark=theme==='dark';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');});}function current(){return document.documentElement.dataset.theme||'light';}document.addEventListener('click',function(event){var target=event.target;if(!(target instanceof Element))return;var button=target.closest('[data-theme-toggle]');if(!button)return;var next=current()==='dark'?'light':'dark';localStorage.setItem('owed-theme',next);apply(next);});media.addEventListener('change',function(event){if(!localStorage.getItem('owed-theme'))apply(event.matches?'dark':'light');});if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){apply(current());});}else{apply(current());}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "Owed — A private debt and IOU tracker";
  const description = "Remember money between friends, family, roommates, and coworkers with a calm, local-first personal debt tracker.";
  return {
    metadataBase: base,
    title: { default: title, template: "%s" },
    description,
    keywords: ["debt tracker", "IOU tracker", "money tracker", "personal debt tracker", "private debt tracker"],
    icons: { icon: "/favicon.png", apple: "/app-icon.png" },
    openGraph: { type: "website", siteName: "Owed", title, description, images: [{ url: new URL("/og.png", base).toString(), width: 1536, height: 1024, alt: "Owed — remember what matters, not who owes what" }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og.png", base).toString()] },
    alternates: { canonical: "/" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body className={geist.variable}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: themeControlsScript }} />
      </body>
    </html>
  );
}
