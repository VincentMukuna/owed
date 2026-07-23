# Owwed — Marketing Website

The marketing and support site for [Owwed](../README.md), built with [Next.js](https://nextjs.org/) (App Router).

It hosts the landing page, help center, feedback form, Android waitlist, waitlist admin, and the privacy policy and terms of service.

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
| `npm run build` | Production build |
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

```
NEXT_PUBLIC_FEEDBACK_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_FEEDBACK_SUPABASE_PUBLISHABLE_KEY=
FEEDBACK_SUPABASE_SERVICE_ROLE_KEY=
```

Leaving the public vars unset is fine for layout work — forms simply won't submit.

### Android waitlist emails (Resend)

Closed testing flow:

1. User joins `/android` → server action stores the row as `pending`
2. You get a notify email; they get a waitlist acknowledgment (no Play link yet)
3. You add them in Play Console
4. You open `/admin/android-waitlist` and click **Send invite**

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `WAITLIST_FROM_EMAIL` | e.g. `beta@owwed.builtby.vin` |
| `WAITLIST_REPLY_TO` | Where replies go (your Gmail) |
| `WAITLIST_NOTIFY_EMAIL` | Where new-signup pings go |
| `WAITLIST_ANDROID_INVITE_URL` | Play Store URL; `/go/android` redirects here (emails link to `/go/android`) |
| `WAITLIST_ADMIN_PASSWORD` | Shared password for `/admin/android-waitlist` |
| `WAITLIST_ADMIN_SESSION_SECRET` | Random secret for signing the admin cookie |

Apply the feedback-app migration that adds `status` / `invited_at` before using the admin send flow.

## Structure

```
app/
  page.tsx                 # Landing page
  help/                    # Help center
  feedback/                # Feedback form
  android/                 # Android waitlist
  admin/android-waitlist/  # Password-protected invite sender
  privacy/, terms/         # Legal pages
  actions/                 # Server actions
  lib/                     # Supabase + email helpers
  site-components.tsx      # Shared header, footer, brand, store buttons
public/                    # Static assets (icons, screenshots, OG image)
```
