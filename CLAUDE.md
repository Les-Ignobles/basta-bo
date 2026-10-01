# basta-bo Development Guidelines

Admin back-office for Basta.

## Stack

Next.js 15.5.9 (App Router, Turbopack), React 19.1.0, TypeScript ^5, Tailwind CSS ^4, Zustand 5.0.8, Supabase Client 2.58.0, Radix UI, Zod.

## Project Structure

```text
app/           Next.js App Router pages, layouts and API routes
components/    Shared UI components (sidebar, auth, image upload, shadcn/radix primitives in ui/)
features/      Feature modules (advice, cooking, statistics, subscriptions, unsubscribe-feedbacks, users)
hooks/         Shared React hooks (admin check, debounce, mobile detection)
lib/           Core libs: Supabase clients, repositories, i18n, AI helpers, shared types and utils
migrations/    SQL migrations for Supabase
scripts/       One-off SQL/maintenance scripts
specs/         Feature specs (spec-kit style: plan, research, tasks per feature)
docs/          Feature documentation (image upload usage, role system)
```

## Commands

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build (Turbopack)
- `npm run start` — run the production build
- `npm run lint` — run ESLint

## Code Style

TypeScript ^5: follow standard conventions. Formatted with Prettier (`prettier-plugin-tailwindcss` sorts Tailwind classes).

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
