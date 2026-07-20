# Owwed — Marketing Website

The marketing and support site for [Owwed](../README.md), built with [Next.js](https://nextjs.org/) (App Router) and static export.

It hosts the landing page, help center, feedback form, Android waitlist, and the privacy policy and terms of service.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build (static export) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next.js config) |

## Environment

Copy [`.env.example`](./.env.example) to `.env.local` and fill in what you need.

### Store and beta links

CTA buttons on the homepage, header, and footer are driven by these public vars (baked in at **build** time):

| Variable | When to set |
| --- | --- |
| `NEXT_PUBLIC_IOS_BETA_URL` | TestFlight join URL (current default) |
| `NEXT_PUBLIC_IOS_STORE_URL` | App Store URL after Apple approval |
| `NEXT_PUBLIC_ANDROID_BETA_URL` | Play open/closed testing opt-in URL |
| `NEXT_PUBLIC_ANDROID_STORE_URL` | Production Play Store listing URL |

**Priority:** a store URL wins over a beta URL. If both Android URLs are empty, the site shows the `/android` waitlist.

**Flip workflow (Vercel):** set the new URL in project env → redeploy. No code change.

Examples:

1. Open testing ready → set `NEXT_PUBLIC_ANDROID_BETA_URL` → redeploy  
2. Production Play live → set `NEXT_PUBLIC_ANDROID_STORE_URL` → redeploy  
3. App Store approved → set `NEXT_PUBLIC_IOS_STORE_URL` → redeploy  

Old `/android` waitlist links redirect to the Play store or beta URL once either Android env is set.

### Feedback and waitlist backend

The feedback form and Android waitlist submit to a Supabase backend:

```
NEXT_PUBLIC_FEEDBACK_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_FEEDBACK_SUPABASE_PUBLISHABLE_KEY=
```

Leaving them unset is fine for working on layout and content — the forms simply won't submit.

## Structure

```
app/
  page.tsx           # Landing page
  help/              # Help center
  feedback/          # Feedback form
  android/           # Android waitlist
  privacy/, terms/   # Legal pages
  lib/               # Supabase form helpers
  site-components.tsx # Shared header, footer, brand, store buttons
public/              # Static assets (icons, screenshots, OG image)
```
