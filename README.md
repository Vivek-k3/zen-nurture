# Zen Nurture

Zen Nurture is an open-source, AI-assisted baby care tracker built for the hardest version of parenting: the sleep-deprived, shift-based, high-stakes reality where feeds, naps, diapers, medicines, vaccines, growth checks, and doctor follow-ups all blur together.

This project exists because baby tracking is not a simple checklist problem. It is a memory problem, a coordination problem, a health-context problem, and often a stress problem. Parents do not forget because they do not care. They forget because they are exhausted.

We are building Zen Nurture to reduce that cognitive load.

Instead of asking families to become perfect data-entry operators, the goal is to give them a system that can help them:

- remember what happened and when
- spot patterns they would otherwise miss
- receive timely reminders
- keep a clean, shared record across caregivers
- understand growth and routines over time
- prepare better context for pediatric visits

## Why This Matters

Baby healthcare is important enough that the tooling around it should not be fragile, opaque, or locked away behind a black box.

Parents need more than a tracker. They need support.

That means:

- logging quickly when their hands are full
- getting reminders when their brains are overloaded
- seeing trends without manually building spreadsheets
- keeping medicine, vaccine, and growth history in one place
- preserving records and media in a family-accessible system
- eventually making doctor handoff and record sharing much easier

Zen Nurture is our attempt to solve that mess in a practical way.

## What Zen Nurture Is

Zen Nurture is a shared family workspace for baby care, with an AI assistant named Mora.

At the center of the app is a structured event timeline. Families can log the things that actually matter day to day:

- bottle feeds
- breastfeeding sessions
- pumping
- diapers
- sleep
- medicines
- vaccines
- notes
- growth measurements

From there, the app layers on reminders, summaries, charts, milestone tracking, uploads, and AI-assisted workflows so the data becomes useful instead of just archived.

## What The App Does Today

### Core tracking

- Shared baby profiles for families and caregivers
- Fast logging for feeds, sleep, diapers, pumping, notes, medicines, vaccines, and growth
- Timeline view for reviewing and correcting past events
- Photos attached to events and milestones

### Trends and summaries

- Daily and range-based aggregates from the event stream
- Trend views for routines over time
- Growth charts with WHO percentile references
- Weekly digest generation
- Milestone tracking with custom entries

### Reminders and notifications

- Reminder rules for recurring care tasks
- Smart reminder suggestions from Mora based on patterns
- Web push notification support for reminder delivery

### Mora, the AI assistant

- Answers questions using live baby context, recent events, reminders, and page context
- Can summarize the day, analyze patterns, and suggest next steps
- Can help log records or manage reminders
- Uses an approval flow by default before write actions are executed
- Supports an optional YOLO mode for auto-executing approved scopes

### Family coordination

- Family and caregiver access model
- Invitations for shared access
- One active baby context per device for reminders, KPIs, milestones, and Mora
- Voice-to-text transcription for faster input when typing is inconvenient

## What We Are Building Toward

The long-term initiative is bigger than a tracker.

We want Zen Nurture to become a trustworthy baby-health companion that helps families move from fragmented memory to clear context. That includes work in and around:

- better anomaly surfacing from routines, growth, and event patterns
- stronger clinician handoff, summaries, and doctor-sharing workflows
- safer organization of medical records, visit notes, prescriptions, and vaccine history
- more transparent, inspectable health logic instead of hidden product decisions
- deployment ownership for families, builders, and clinics who want to run their own version

Some of that is already present in the current product. Some of it is still roadmap. The README is intentionally framing both the current app and the reason this repository exists.

## Why Open Source

We are open-sourcing Zen Nurture because baby health workflows should be inspectable and adaptable.

Open source gives families and contributors the ability to:

- audit how tracking and AI workflows behave
- fork the project and run their own deployment
- adapt the app to local care norms and caregiver needs
- improve privacy, safety, and record portability in the open
- avoid being trapped in a closed baby-health product

If software is helping manage baby health, reminders, records, and trend interpretation, people should be able to inspect the code and understand what it is doing.

## Safety, Privacy, And Scope

Zen Nurture is not a medical device and should not be treated as a diagnostic system. Mora can help summarize, remind, and surface patterns, but it does not replace a pediatrician, emergency care, or professional medical judgment.

Important boundaries:

- Treat anomaly or pattern suggestions as prompts for review, not diagnosis.
- Review medicine, vaccine, and care decisions with qualified clinicians.
- Do not assume this repository is automatically compliant with any healthcare regulation in your deployment.
- If you use Zen Nurture with sensitive data, you are responsible for your hosting, access controls, backups, and operational policies.

The current codebase is built around authenticated access and family-scoped authorization, but operational security still depends on how you deploy and maintain it.

## Product Architecture

Zen Nurture uses:

- Next.js App Router for the frontend
- React 19 and TypeScript
- Tailwind CSS and shadcn/ui for the UI layer
- Convex for the realtime database, backend logic, storage, and HTTP actions
- Better Auth with `@convex-dev/better-auth` for authentication
- OpenAI + the Vercel AI SDK for Mora

Events are the core data model. Most baby-care actions are stored as structured events, and the rest of the product builds on top of that event stream.

For a deeper system walkthrough, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Local Development

### Prerequisites

- Node.js 20+
- `pnpm`
- A Convex project/deployment
- OpenAI API access if you want to use Mora, weekly digests, or transcription

### Install

```bash
pnpm install
```

### Environment variables

Create `.env.local` and configure the values your setup needs:

```env
# Core app / Convex
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
CONVEX_SITE_URL=
CONVEX_DEPLOYMENT=
SITE_URL=http://localhost:3000

# AI
OPENAI_API_KEY=
MORA_MODEL=gpt-4.1-nano

# Better Auth infra (optional)
BETTER_AUTH_API_KEY=
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000

# Push reminders (optional)
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

#### Variable notes

- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL used by the frontend and API routes.
- `NEXT_PUBLIC_CONVEX_SITE_URL`: Convex site URL used for auth rewrites and server-side routes.
- `CONVEX_SITE_URL`: Used by Convex-side auth HTTP helpers; usually matches `NEXT_PUBLIC_CONVEX_SITE_URL`.
- `CONVEX_DEPLOYMENT`: Convex dev deployment identifier for local backend development.
- `SITE_URL`: Base URL used by Better Auth.
- `OPENAI_API_KEY`: Required for Mora chat, digests, and transcription.
- `MORA_MODEL`: Optional override for the Mora model. Defaults to `gpt-4.1-nano`.
- `BETTER_AUTH_API_KEY`: Optional; enables Better Auth infra integrations used by this repo.
- `CRON_SECRET`: Required for cron-secured reminder push routes.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`: Required if you want web push notifications.

### Run the app

The repo default is:

```bash
pnpm dev
```

This starts Convex and Next.js together.

If you do not have the `portless` helper used by this repository, run the services separately:

```bash
pnpm convex
pnpm exec next dev
```

### Useful scripts

```bash
pnpm dev
pnpm convex
pnpm lint
pnpm build
pnpm test:fast
pnpm test:e2e
pnpm test
pnpm deploy
```

## Contributing

Contributions are welcome, especially around:

- caregiver UX under real-world stress
- baby-health workflow clarity
- privacy and security hardening
- records portability and clinician handoff
- reminder intelligence and anomaly surfacing
- accessibility and mobile-first usability

When contributing, favor changes that reduce parent effort, increase clarity, and keep the system honest about what it knows versus what it is inferring.

## Project Intent

This repository is not just about building another tracker.

It is about building software that respects how hard baby care actually is.

If Zen Nurture succeeds, it should help parents spend less time reconstructing the last 24 hours and more time caring for their child with confidence.
