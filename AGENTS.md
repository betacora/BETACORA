<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

BeTacora is a single Next.js 16 (Turbopack) app (travel planner, Spanish UI). Standard scripts live in `package.json` (`dev`, `build`, `start`, `lint`); typecheck is `npx tsc --noEmit`. CI (`.github/workflows/ci.yml`) runs `npx tsc --noEmit` + `npm run build`.

- `.env.local` is required for local dev. Client pages import `lib/supabase.ts`, which calls `createClient(url, key)` at module load and throws if `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty. A placeholder `.env.local` (same values CI uses) is kept in the VM snapshot so `npm run dev` boots; the home page (`/`) does not import Supabase and works even without it, but `/auth`, `/explorar`, `/perfil`, etc. need at least the placeholders.
- What real secrets gate (see `.env.example`): Supabase (auth + data + account deletion via `SUPABASE_SERVICE_ROLE_KEY`), `ANTHROPIC_API_KEY` (`/api/generate-itinerary`, `/api/assistant-chat`), `DUFFEL_API_KEY` (flights), `VIATOR_API_KEY` (activities), Upstash (`@upstash/*`, rate limiting). With only placeholders: landing, the questionnaire, and `/api/geo/search` work; auth-gated pages redirect to `/auth`, and itinerary/flights/activities routes return 401/fail.
- The signature "Travel DNA" archetype is computed client-side (`lib/archetypes-core.js` → `window.BTArchetypes.selectArchetype`), so the questionnaire → profile card flow works with no external APIs. The questionnaire itself is a static file at `public/questionnaire.html`, embedded via iframe in the auth-gated `/explorar` route. To test it without logging in, open `/questionnaire.html?mode=discover` directly. Clicking "Generar mi Bitácora Inteligente" renders the client-side archetype card immediately; the full AI itinerary below it needs `ANTHROPIC_API_KEY` + auth.
- `npm run lint` reports pre-existing errors/warnings across the repo; it is not wired into CI and does not block dev/build.
- `scripts/verify-*.mjs` are Playwright checks that launch Chrome via `channel: "chrome"` against a running dev server; some also read fixtures under `tmp/` that may not exist.
