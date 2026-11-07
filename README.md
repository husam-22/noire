# NOIRÉ

## Current checkpoint

Phase 12 — internationalization (Arabic + English), RTL layout, automated test baseline, and Supabase backend scaffolding (schema, RLS, RPCs, auth, seed).

## Implementation status

This repository preserves a demo storefront and admin interface. Backend/database persistence, admin authentication/authorization, real payment processing, and fulfillment are not production-integrated. Demo checkout remains pending settlement; no payment authorization/capture or fulfillment is connected.

**ADMIN AUTHENTICATION IS ONLY ENFORCED WHEN SUPABASE IS CONFIGURED.** In mock/preview mode `noindex, nofollow` is not access control.

## Scripts

| Command             | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server on `0.0.0.0:3000`                        |
| `npm run build`     | Production build (fonts are self-hosted, no network) |
| `npm run lint`      | ESLint (`next lint`)                                |
| `npm run typecheck` | `tsc --noEmit`                                      |
| `npm test`          | Vitest unit tests (`tests/unit`)                    |
| `npm run test:e2e`  | Playwright end-to-end tests (`tests/e2e`)           |

Playwright needs browsers once: `npx playwright install chromium`.
By default the e2e config boots `npm run dev`; set `PLAYWRIGHT_BASE_URL` to target an already running server.

## Internationalization & RTL

Routing is handled by [`next-intl`](https://next-intl.dev) with the `as-needed` prefix strategy:

| URL            | Locale  | Direction |
| -------------- | ------- | --------- |
| `/`, `/shop`   | English | LTR       |
| `/ar`, `/ar/…` | Arabic  | RTL       |

Key pieces:

- `i18n/routing.ts` — supported locales, default locale, `getDirection()` / `isRtlLocale()` helpers.
- `i18n/navigation.ts` — locale-aware `Link`, `useRouter`, `usePathname`, `redirect`. **Always import navigation primitives from here, not from `next/link` / `next/navigation`.**
- `i18n/request.ts` — loads `messages/<locale>.json` for the active request.
- `middleware.ts` — locale negotiation and redirects (`/fr/*` → 404).
- `app/[locale]/layout.tsx` — sets `<html lang dir>`, wires `NextIntlClientProvider`, and localized metadata.
- `messages/en.json`, `messages/ar.json` — translation catalogs. Namespaces: `metadata`, `language`, `nav`, `bag`, `megaMenu`, `footer`, `catalog`, `home`, `common`, `product`, `shop`, `notFound`.
- `lib/i18n/` — catalog copy localization. Category/collection fixture copy is English; Arabic overrides live in `messages/ar.json → catalog.*` and fall back to the fixtures when a key is missing. Server pages read catalog data through `lib/services/localized.ts`.
- `lib/hooks/use-direction.ts` — `useDirection()`, `useIsRtl()`, and `toPhysicalX()` for mirroring framer-motion offsets in RTL.
- `components/navigation/language-switcher.tsx` — header / mobile-drawer switcher that preserves the current path and query string.

Conventions:

- Use **logical** Tailwind utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `border-s`, …) instead of physical left/right classes so layouts mirror automatically under `dir="rtl"`.
- Brand/product names (`NOIRÉ`, `AETHER-01`, model codes, studio coordinates) intentionally stay in English in both locales.
- `messages/en.json → catalog` and `shop.filters` are intentionally empty: English falls back to the source fixture labels. The unit test `tests/unit/messages-parity.test.ts` enforces key parity for every other namespace.

### Translation coverage

| Area                                                          | Status                  |
| ------------------------------------------------------------- | ----------------------- |
| Global shell (header, mega menu, mobile drawer, bag, footer)  | ✅ EN / AR              |
| Home page (all sections)                                      | ✅ EN / AR              |
| Shop archive (intro, toolbar, filters, grid, pagination)      | ✅ EN / AR              |
| Product cards & quick-view modal                              | ✅ EN / AR              |
| Shared UI (modal, drawer, toasts, error / empty states, 404)  | ✅ EN / AR              |
| Catalog taxonomy (categories, collections)                    | ✅ EN / AR              |
| Product detail dossier, cart, wishlist, search overlay        | 🔜 RTL layout, EN copy  |
| Checkout, account, order confirmation, admin                  | 🔜 RTL layout, EN copy  |

To translate a remaining component: add `const t = useTranslations('<namespace>')` (or `getTranslations` in Server Components), replace literals with `t('key')`, and add the key to **both** message files — the parity test fails otherwise.

## Backend (Supabase)

The full backend specification lives in [`docs/BACKEND_REQUIREMENTS.md`](docs/BACKEND_REQUIREMENTS.md) (Arabic).
Quick start:

```bash
cp .env.example .env.local        # fill NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY
supabase link --project-ref <ref> # once
npm run db:push                   # apply supabase/migrations/*.sql
npm run db:seed                   # load fixtures + Arabic catalog translations (service role)
#   …or without a service-role key: npm run db:seed:sql → paste supabase/seed.sql in the SQL Editor
NOIRE_DATA_SOURCE=supabase npm run dev
```

| Command            | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `npm run db:push`  | Apply migrations to the linked project                    |
| `npm run db:reset` | Recreate the local database (`supabase start`) from migrations |
| `npm run db:seed`  | Upsert fixtures into Supabase (idempotent)                |
| `npm run db:seed:sql` | Emit the same seed as idempotent SQL → `supabase/seed.sql` (no service-role key needed) |
| `npm run db:types` | Regenerate `types/supabase.ts` from the live schema       |

- `NOIRE_DATA_SOURCE=mock` (default) keeps the app on in-memory fixtures; `supabase` switches catalog reads to Postgres via `lib/services/supabase/`.
- When Supabase credentials are present, `middleware.ts` requires a session for `/account` and the `staff`/`admin` role for `/admin`. Without them the app runs in preview mode and **`/admin` stays unprotected**.
- Orders are created only through the `place_order()` RPC (server-side pricing, inventory, discounts, idempotency). Payments (Stripe) are phase 2.

## Known limitations

- `notFound()` pages render their shell client-side in Next.js 14 when the root layout lives under `[locale]`; the response status is still `404` and the localized content hydrates immediately.
- Product fixture copy (names, descriptions, specs) is not localized; a future Supabase-backed catalog should store per-locale copy columns.
