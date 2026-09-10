<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# mirror / 观己 — Agent Guide

## Product direction

- Chinese MBTI-style self-exploration site, designed for WeChat mobile first and adapted to PC.
- Visual system is fixed: cool gray paper `#edf2f3`, near-black ink `#171b1c`, black editorial report `#121718`, warm accent `#c49473`, thin radar chart, pill-shaped primary actions, Manrope for Latin + system CJK fonts.
- The reference screenshots in `docs/design-evidence/` are the source of truth for layout, density, spacing and copy. Do not change copy strings, pixel values or colors without a matching screenshot or explicit user request.
- The paid report price is `PRICE_FEN` (default ¥6.9). In `mock` payment mode every "演示" label must stay; in `wechat` mode they switch to real payment copy. Never present the client-side `unlocked` flag as authorization: `/report/[id]` decides on the server.

## Stack rules

- Next.js 16 App Router with `cacheComponents: true`. Anything that reads `cookies()`, `headers()`, `params`, `searchParams`, `usePathname()`, `useSearchParams()` or does uncached I/O must sit under a `<Suspense>` boundary or a `loading.tsx`. Route handlers that must never be prerendered call `await connection()` first.
- `src/proxy.ts` (not middleware) issues the signed `mid` visitor cookie. Sign/verify lives in `src/lib/visitor-token.ts`; server code reads it through `src/lib/session.ts`.
- `/my/report` renders every result owned by the signed visitor, newest first, including unpaid summaries. Never infer history from localStorage. Full order numbers are bearer recovery credentials: `POST /api/reports/recover` restores the order's visitor cookie for any order status, but never unlocks a result. Keep order numbers owner-only, the same-origin check, database-backed rate limit, and fresh navigation after recovery; the proxy must not overwrite this response's restored cookie.
- Tailwind v4 with tokens in `src/app/globals.css` (`@theme`). Breakpoints are `md` = 721px, `xl` = 1101px, `2xl` = 1450px to mirror the prototype's media queries. Mobile-first: base classes are the phone layout, `md:` is desktop. Use arbitrary values for exact prototype numbers (`text-[10px] tracking-[.14em]`). Shared patterns are `@utility` (`eyebrow`, `pill`, `text-link`, `back-button`, `pb-safe-4`).
- shadcn/ui primitives live in `src/components/ui/*` and are restyled to the prototype; add new ones with `npx shadcn@latest add <name>` then restyle. Icons come from `@phosphor-icons/react` (`/dist/ssr` in Server Components).
- Client islands are small and explicit: `quiz/quiz.tsx`, `result/result-actions.tsx`, `payment/*`, `report/chapter-ui.tsx`, `site/site-overlays.tsx`. Prefer `useSyncExternalStore` over `setState` in effects (the React Compiler lint rule is an error).
- Page content must be in the server HTML. The report is the case to watch: `report/report-body.tsx` is a Server Component that renders **all four chapters plus both the strengths and the blind-spot lists**, and `report/chapter-ui.tsx` only toggles which one is visible. Never move chapter content back into a client component — a JS-free reader must see the whole report. `tests/e2e/flow.spec.ts` asserts this against the raw HTML.
- The public sample shows everything with no interaction. `report-body.tsx` exports two views of the same chapters: `ReportBody` (the paid reader, one chapter at a time) and `ReportFullReading` (every chapter stacked, both insight lists open), which `/result/sample` renders inline under the profile. `/result/sample` is the canonical sample and the only one in the sitemap; `/report/sample` stays as the reader view with `canonical` pointing at it.
- The sample sells the test, not the report. `/result/sample` closes with `result/sample-cta.tsx` (轮到你了 → `/quiz`, price demoted to a footnote) and a plain `/quiz` dock; it must never render `UnlockPanel`, an unlock button, or a hero price — the reader has already read everything, so there is nothing to buy on that page. `ResultActions` and `PaymentSheet` are for real results only and are not mounted on the sample. `tests/e2e/flow.spec.ts` asserts this.
- The active chapter is derived from `?chapter=` by `report/chapter-store.ts` (a `useSyncExternalStore` over `history`), not from `useSearchParams`, so the page stays statically prerenderable. The trade-off: a deep link like `?chapter=3` paints chapter 01 until hydration swaps it. Do not "fix" that with an inline script — it fights hydration and costs the static HTML.
- Data access: `src/lib/results.ts`, `src/lib/orders.ts`, `src/lib/visitors.ts` on top of Drizzle (`src/db`). Schema changes go through `npm run db:generate` and commit the SQL under `drizzle/`.
- Payments: `src/lib/payments/index.ts` picks the provider from `PAYMENT_PROVIDER`. The WeChat adapter is self-contained under `src/lib/payments/wechat/` (Node `crypto` only). Keep `crypto.ts` pure so it stays unit-testable.
- OG images render with satori; fonts are the TTFs in `src/fonts/`. After changing Chinese copy that appears in OG images, run `node scripts/build-og-fonts.mjs` to refresh the CJK subset.

## Verification before handoff

```bash
npm run typecheck && npm run lint && npm test && APP_URL=http://localhost:3000 npm run build
npm run test:e2e   # needs DATABASE_URL and a built app; runs mobile + desktop projects
```

Compare new screenshots against `docs/design-evidence/` at 393×852 and 1363×936. Record durable design decisions here.
