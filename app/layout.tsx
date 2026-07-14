import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

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
  return <html lang="en"><body className={geist.variable}>{children}</body></html>;
}
