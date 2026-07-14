import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const themeBootScript = `(function(){try{var saved=localStorage.getItem('owed-theme');var dark=saved?saved==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=dark?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){}})();`;

const themeControlsScript = `(function(){var media=window.matchMedia('(prefers-color-scheme: dark)');function apply(theme){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;document.querySelectorAll('[data-theme-toggle]').forEach(function(button){var dark=theme==='dark';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');});}function current(){return document.documentElement.dataset.theme||'light';}document.addEventListener('click',function(event){var target=event.target;if(!(target instanceof Element))return;var button=target.closest('[data-theme-toggle]');if(!button)return;var next=current()==='dark'?'light':'dark';localStorage.setItem('owed-theme',next);apply(next);});media.addEventListener('change',function(event){if(!localStorage.getItem('owed-theme'))apply(event.matches?'dark':'light');});if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){apply(current());});}else{apply(current());}})();`;

const title = "Owwed: Private Debt Tracker for Friends & Family";
const socialTitle = "Owwed: A simpler way to remember money";
const description =
  "Track money you’ve lent, money you owe, payments, reminders, and due dates in one private, local-first app. Free, with no account required.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s" },
  description,
  icons: { icon: "/favicon.png", apple: "/app-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Owwed",
    title: socialTitle,
    description,
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "Owwed: a simpler way to remember money",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: ["/og.png"],
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={geist.variable}>
        {children}
        <script dangerouslySetInnerHTML={{ __html: themeControlsScript }} />
      </body>
    </html>
  );
}
