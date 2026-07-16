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

The feedback form and Android waitlist submit to a Supabase backend. Configure these in a `.env.local` file if you want those forms to work locally:

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
