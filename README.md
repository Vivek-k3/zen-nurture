<div align="center">

# Zen Nurture

**A calm, India-first baby care tracker with AI-assisted logging and insights.**

Log feeds, diapers, sleep, and medicine in seconds. Get proactive nudges, weekly digests, gentle reminders, and an in-app AI companion that can act on your behalf — all wrapped in a quiet, parent-friendly interface.

[View in AI Studio](https://ai.studio/apps/drive/1EQ8Oa10Kh9aTDQYpuk73koKTUfQ1hhr7) · [Report a bug](https://github.com/Vivek-k3/zen-nurture/issues) · [Request a feature](https://github.com/Vivek-k3/zen-nurture/issues)

</div>

---

## Why Zen Nurture

Most baby trackers are noisy, ad-supported, and built around US-centric units and recommendations. Zen Nurture is the opposite: a single, calm screen for the four things that actually matter in the first year, with a sensible India-first defaults and an AI that does the typing for you.

- **Fast to log.** A bottom-sheet Quick Logger that records feed / diaper / sleep / med in two taps.
- **Fast to recall.** Live timer cards answer "when was the last feed?" without scrolling.
- **Smart, not loud.** Nudges only when something is genuinely off — missed feed window, low intake, overdue med.
- **Honest about caregivers.** Multiple caregivers on one baby, each with a colour, so the night shift isn't anonymous.
- **An AI that does work, not chat.** Mora reads the page you're on, proposes an action, and asks before doing it.

## Features

### Today
- Live timer cards for last **feed**, **diaper**, **sleep**, and **medicine** with monospaced elapsed time.
- Daily summary (feed count, total ml, diaper count, sleep hours).
- Next reminder with overdue state.
- Quick-suggestion pills driven by the last event and the past 7 days.
- Activity feed of the day's events with caregiver attribution.

### Logging
- **Feed** — bottle (breast milk, formula, cow milk) with amount, or breast with side and duration.
- **Diaper** — wet, dirty, mixed, with optional notes.
- **Sleep** — start/stop with auto-detection of the running session.
- **Medicine** — picked from a medicines library with dose, unit, and instructions.
- **Photos & voice notes** — attach to any event; voice is transcribed server-side.

### Caregiving
- Multiple **baby profiles** per account with a switcher.
- Multiple **caregivers** per baby (name + colour, optionally linked to a user).
- **Family sharing** — invite another parent or grandparent by email with a role.
- **Onboarding** flow that sets up baby, timezone, and units on first run.

### Trends
- Range and day filters, calendar view, metric drawer, growth chart.
- Weekly comparison view (this week vs last) for feeds, diapers, sleep.
- Markdown-rendered weekly digest card.

### Milestones
- Curated milestone library (motor, language, social, cognitive) with age windows.
- Custom milestones, photo and video attachments, notes.

### Reminders & Nudges
- Reminder rules with category, trigger type, and quiet hours.
- **Web push notifications** via a cron-protected endpoint (`Authorization: Bearer <CRON_SECRET>`).
- **In-app nudge banner** with three severities (info, warn, alert) computed from the live event stream.

### Mora — the in-app AI
- An OpenAI-powered assistant accessible from every page.
- Reads the current route (e.g. "Today", "Trends") and baby context to stay grounded.
- Can **propose actions** (log a feed, create a reminder, add a note) that require explicit approval before they run.
- Scope-controlled server-side: by default, Mora can only touch `events`, `reminders`, and `notes`.
- Conversation threads and audit trail stored in Convex.

### Digest & email
- Weekly digest generation (this-week vs last-week) with markdown body.
- **Resend** integration for delivery.

### Auth & accounts
- **Better Auth** wired into Convex with email + password.
- Per-user session, per-family access control, per-baby authorization helpers (`requireBabyAccess`).

## Getting started

### Prerequisites
- **Node.js** 20+
- **pnpm** 9.10 (`npm i -g pnpm`)
- A [Convex](https://convex.dev) account (free tier is fine)
- A **Gemini API key** for AI Studio / Mora features
- (Optional) **VAPID keys** for web-push, **Resend API key** for email digest

### 1. Install

```bash
pnpm install
```

### 2. Configure Convex

```bash
pnpm convex dev
```

This provisions your dev deployment and writes `NEXT_PUBLIC_CONVEX_URL` into `.env.local` for you.

### 3. Configure the app

Create or update `.env.local`:

```bash
# Convex (auto-populated by `convex dev`)
NEXT_PUBLIC_CONVEX_URL=

# AI
GEMINI_API_KEY=
OPENAI_API_KEY=

# Push notifications (server-side cron)
CRON_SECRET=

# Weekly digest email
RESEND_API_KEY=
```

In the **Convex dashboard → Settings → Environment Variables**, also set `CRON_SECRET` so cron callers can authenticate against the push endpoints.

### 4. Run

```bash
# Convex + Next together
pnpm cdev

# Or, separately
pnpm convex   # terminal 1
pnpm dev      # terminal 2
```

Open `http://localhost:3000`, create an account, and complete the onboarding flow.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server (uses `portless` for the `zen` subdomain) |
| `pnpm convex` | Convex dev (sync schema, regenerate types, run functions) |
| `pnpm cdev` | Both, in parallel with prefixed logs |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm deploy` | `vercel build --prod` + `vercel deploy --prebuilt --prod` |

## Project layout

```
.
├── convex/                # Realtime backend
│   ├── schema.ts          # Tables, indexes
│   ├── events.ts          # Logging, aggregates, ranges
│   ├── reminders.ts       # Reminder rules + computation
│   ├── nudges.ts          # Proactive banner content
│   ├── digest.ts          # Weekly comparison
│   ├── mora.ts            # AI assistant (threads, actions, scopes)
│   ├── push.ts            # Web-push subscriptions
│   ├── pushCron.ts        # Cron-authed HTTP endpoints
│   ├── http.ts            # HTTP router (auth, push, cron)
│   ├── auth.ts            # Better Auth wiring
│   └── lib/               # Auth helpers (requireBabyAccess, …)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Today
│   │   ├── records/           # Full event log
│   │   ├── trends/            # Charts, calendar, growth
│   │   ├── milestones/        # Milestone library
│   │   ├── reminders/         # Reminder rules
│   │   ├── settings/          # Account, baby, family
│   │   ├── onboarding/        # First-run flow
│   │   ├── add-baby/          # Add a child
│   │   ├── sign-in/, sign-up/ # Auth screens
│   │   └── api/               # Route handlers (mora, push, digest, transcribe, auth)
│   ├── components/            # UI building blocks (cards, drawer, charts, Mora orb, …)
│   ├── hooks/                 # useLiveTimer, …
│   └── lib/                   # time, constants, auth-client, …
├── scripts/                   # browser-test.sh, deploy-vercel.sh
└── docs/                      # Engineering notes (e.g. Convex loading-state pattern)
```

## Data model (Convex)

The full schema lives in `convex/schema.ts`. The hot tables:

- `babyProfiles` — one per child, with `dob`, `gender`, `timezone`, `measurementUnits`.
- `events` — append-only log keyed by `(babyId, timestamp)` and `(babyId, type, timestamp)`.
- `reminderRules` — per-baby rules with trigger config, quiet hours, snooze options.
- `milestones` — keyed achievements with optional photo/video attachments.
- `weeklyDigests` — generated this-week-vs-last-week snapshots.
- `moraThreads` / `moraMessages` / `moraActions` — assistant conversations and the audit trail of approved actions.
- `pushSubscriptions` — `web-push` endpoints, one per user per device.
- `families`, `familyMembers`, `familyInvitations` — multi-user, multi-baby sharing.

## Convex HTTP surface

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/*` | Better Auth routes (sign-up, sign-in, session, …) |
| `POST` | `/api/push/cron-subs` | Cron pulls subscriptions to fan out a push |
| `POST` | `/api/push/cron-unsubscribe` | Cron reports a stale endpoint to clean up |

Cron callers must send `Authorization: Bearer ${CRON_SECRET}`.

## Next.js route handlers

- `POST /api/mora` — streams the AI response (text + tool calls).
- `POST /api/transcribe` — turns a voice clip into text for the Quick Logger.
- `POST /api/digest/generate` — builds the weekly digest and (optionally) emails it via Resend.
- `POST /api/push/subscribe` — registers a `web-push` subscription for the current user.

## Design

- **Palette:** sage, oat, espresso, clay, dusty blue, night — a quiet, low-saturation set tuned for tired eyes.
- **Type:** [Manrope](https://fonts.google.com/specimen/Manrope) for display, [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for the timer readouts.
- **Iconography:** Material Symbols (rounded, filled).
- **Motion:** restrained; the live timer and nudge banner are the only animated surfaces.
- **Dark mode** is the default; a theme toggle lives in the user menu.

## Deployment

The repo ships a `vercel.json` that runs `npx convex deploy --cmd 'pnpm run build' -y` on every prod build, so schema and functions ship in lockstep with the frontend.

```bash
# One-shot prod deploy
pnpm deploy
```

In Vercel, set the env vars from `.env.local` (without the `CONVEX_DEPLOY_KEY` — that's set automatically from the Convex integration). Configure a cron (Vercel Cron, GitHub Actions, or any scheduler) to hit the push HTTP endpoints with the `CRON_SECRET` bearer.

## Conventions

- **Loading vs empty for Convex.** `useQuery` returns `undefined` while loading and a concrete value when ready. Use the shared `DataState` helper (`src/components/DataState.tsx`) instead of `!value` checks. See `docs/convex-loading-states.md`.
- **Auth.** All Convex queries and mutations call `requireAuth` / `requireBabyAccess` from `convex/lib/auth.ts` — never read or write baby-scoped data without it.
- **Mora actions.** Always go through the `moraActions` table. No direct mutations from the AI; approval is enforced server-side.

## Contributing

Issues and PRs welcome. For substantial changes, open an issue first to align on the approach. Keep PRs focused: one feature or fix, a screenshot or short clip for UI changes, and a note on how you tested.

## License

[MIT](LICENSE) — Copyright (c) 2026 Vivek-k3.

## Acknowledgements

- [Convex](https://convex.dev) for the realtime backend.
- [Vercel](https://vercel.com) for hosting and the AI SDK.
- [shadcn/ui](https://ui.shadcn.com) for the component primitives.
