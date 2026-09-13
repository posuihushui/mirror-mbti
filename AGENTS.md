<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# mirror / 观己 — Agent Guide

## Product direction

- Chinese MBTI-style self-exploration site, designed for WeChat mobile first and adapted to PC.
- Visual system is fixed: cool gray paper `#edf2f3`, near-black ink `#171b1c`, black editorial report `#121718`, warm accent `#c49473`, thin radar chart, pill-shaped primary actions, Manrope for Latin + system CJK fonts.
- Brand artwork uses the facing mirror contours and warm centre dot in `src/components/brand/brand-logo.tsx`; the outlined `mirror / 观己` lockup is shared by the header and OG images. Keep the header logo at 168px on phone / 194px on desktop. Run `npm run brand:build` after artwork changes to refresh `public/assets/brand/`, `src/app/favicon.ico` and `docs/brand/logo-preview.png`; see `docs/brand/README.md` for variants.
- The reference screenshots in `docs/design-evidence/` are the source of truth for layout, density, spacing and copy. Do not change copy strings, pixel values or colors without a matching screenshot or explicit user request.
- The paid report price is `PRICE_FEN` (default ¥6.9). In `mock` payment mode every "演示" label must stay; in `wechat` mode they switch to real payment copy. Never present the client-side `unlocked` flag as authorization: `/report/[id]` decides on the server.

## Stack rules

- Next.js 16 App Router with `cacheComponents: true`. Anything that reads `cookies()`, `headers()`, `params`, `searchParams`, `usePathname()`, `useSearchParams()` or does uncached I/O must sit under a `<Suspense>` boundary or a `loading.tsx`. Route handlers that must never be prerendered call `await connection()` first.
- `src/proxy.ts` (not middleware) issues the signed `mid` visitor cookie. Sign/verify lives in `src/lib/visitor-token.ts`; server code reads it through `src/lib/session.ts`.
- `/my/report` renders every result owned by the signed visitor, newest first, including unpaid summaries. Never infer history from localStorage. Full order numbers are bearer recovery credentials: `POST /api/reports/recover` restores the order's visitor cookie for any order status, but never unlocks a result. Keep order numbers owner-only, the same-origin check, database-backed rate limit, and fresh navigation after recovery; the proxy must not overwrite this response's restored cookie.
- Tailwind v4 with tokens in `src/app/globals.css` (`@theme`). Breakpoints are `md` = 721px, `xl` = 1101px, `2xl` = 1450px to mirror the prototype's media queries. Mobile-first: base classes are the phone layout, `md:` is desktop. Use arbitrary values for exact prototype numbers (`text-[10px] tracking-[.14em]`). Shared patterns are `@utility` (`eyebrow`, `pill`, `text-link`, `back-button`, `pb-safe-4`).
- Light pill buttons keep a light background on hover (`paper` / `#edf2f3`) so their ink text stays readable in dark CTA sections; never inherit the dark pill hover fill.
- shadcn/ui primitives live in `src/components/ui/*` and are restyled to the prototype; add new ones with `npx shadcn@latest add <name>` then restyle. Icons come from `@phosphor-icons/react` (`/dist/ssr` in Server Components).
- Client islands are small and explicit: `quiz/quiz.tsx`, `result/result-actions.tsx`, `payment/*`, `report/chapter-ui.tsx`, `site/site-overlays.tsx`. Prefer `useSyncExternalStore` over `setState` in effects (the React Compiler lint rule is an error).
- Page content must be in the server HTML. The report is the case to watch: `report/report-body.tsx` is a Server Component that renders **all four chapters plus both the strengths and the blind-spot lists**, and `report/chapter-ui.tsx` only toggles which one is visible. Never move chapter content back into a client component — a JS-free reader must see the whole report. `tests/e2e/flow.spec.ts` asserts this against the raw HTML.
- **The sample is the real page with sample data — never a second layout.** `/result/sample` is the result page and `/report/sample` is `ReportBody`, the same component a paying reader gets. Do not add a sample-only reading view, and do not embed the report into the result page; if the sample needs something, add it as chrome (`report/sample-notice.tsx`, `result/sample-cta.tsx`) around the shared layout. `tests/e2e/flow.spec.ts` asserts both pages expose the same four chapter panels and switcher.
- Say it is a sample, everywhere: page title, the `SAMPLE REPORT · 示例报告` notice above the reading, the sidebar badge and the phone heading row all read 示例报告 when `data.sample`.
- The sample sells the test, not the report. The notice link, the last chapter's closing link, `SampleCta` and the phone dock all point at `/quiz`; the price stays a one-line footnote. Never render `UnlockPanel`, an unlock button or a hero price on a sample — nothing there is for sale. `ResultActions` and `PaymentSheet` are for real results only and are not mounted on the sample.
- The active chapter is derived from `?chapter=` by `report/chapter-store.ts` (a `useSyncExternalStore` over `history`), not from `useSearchParams`, so the page stays statically prerenderable. The trade-off: a deep link like `?chapter=3` paints chapter 01 until hydration swaps it. Do not "fix" that with an inline script — it fights hydration and costs the static HTML.
- Data access: `src/lib/results.ts`, `src/lib/orders.ts`, `src/lib/visitors.ts` on top of Drizzle (`src/db`). Schema changes go through `npm run db:generate` and commit the SQL under `drizzle/`.
- Questionnaire definitions live in `src/lib/questionnaires.ts`: immutable `legacy32-v1` (32 items) and `standard64-v1` (64 items), balanced by dimension and reverse scoring. Persist question IDs, version, fixed question order, scoring version and report version; changed items require a new version. Keep the original 32-item numeric API and browser drafts compatible. Each version has its own draft; memory fallback must allow completing the current quiz when localStorage fails. Keep manual next, answer review and a confirmed restart of only the current version.
- Quiz shows exactly one previous/next navigation: the fixed dock on phones and the inline navigation from 721px up. Keep both sets on the same answer/progress handlers, allow buttons to shrink on narrow screens, and verify the dock stays inside the viewport before and after scrolling.
- Four dimensions all at or below 60% means unclear: use `profileMeta` / `publicProfile`, show no determinate type, explain both poles, and reject new orders on the server with `UNCLEAR_RESULT`. The 60% threshold is a display convention, not validated confidence. Never remove access to an existing paid report. Paid content uses strength, near-balance, contextual examples and seven days of practice; retain all content in server HTML. Neither questionnaire is a validated or official MBTI instrument; 96-item and A/B versions await user trials.
- Public support email is configured once in `site.supportEmail` and linked from `/help`, privacy and terms. Home visibly says MBTI 测试体验; `/preferences` explains scores and retesting. Preserve the shared brand artwork, colors and sample/paid page architecture when expanding these flows.
- Payments: `src/lib/payments/index.ts` picks the provider from `PAYMENT_PROVIDER`. The WeChat adapter is self-contained under `src/lib/payments/wechat/` (Node `crypto` only). Keep `crypto.ts` pure so it stays unit-testable.
- OG images render with satori; fonts are the TTFs in `src/fonts/`. After changing Chinese copy that appears in OG images, run `node scripts/build-og-fonts.mjs` to refresh the CJK subset.

## Verification before handoff

```bash
npm run typecheck && npm run lint && npm test && APP_URL=http://localhost:3000 npm run build
npm run test:e2e   # needs DATABASE_URL and a built app; runs mobile + desktop projects
```

Compare new screenshots against `docs/design-evidence/` at 393×852 and 1363×936. Record durable design decisions here.
