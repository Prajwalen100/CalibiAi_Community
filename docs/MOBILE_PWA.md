# Mobile + PWA Implementation

How CalibiAI became installable and mobile-native **without changing the desktop UI**.

---

## 1. The desktop-safety contract

Every responsive rule added in this work is scoped below Tailwind's `lg` breakpoint (1024px), one of two ways:

| Mechanism | Compiles to | Active on desktop? |
|---|---|---|
| `max-lg:` / `max-sm:` Tailwind variants | `@media not all and (min-width:1024px\|640px)` | **No** |
| `@media (max-width: 1023.98px \| 639.98px)` in `globals.css` | same range | **No** |

The only unconditional additions are:
- **Brand-new selectors** (`.sheet-panel`, `.skeleton-block`, `.tap-highlight-none`, …) that no existing markup uses.
- **Safe-area utilities**, which resolve to `0px` in a normal browser window.
- **`@media (display-mode: standalone)`**, which never matches in a browser tab.

### How this was verified

A cascade-aware script resolved each changed `className` into `{css-property → winning-utility}` **at a ≥1024px viewport** (where unprefixed/`sm:`/`md:`/`lg:` are all active and `lg` wins, while `xl:`/`max-*` do not apply), then compared old vs. new:

```
Checked 45 changed className strings against the lg cascade.
PASS — desktop (>=1024px) computed styles are IDENTICAL for every change.
```

This caught **19 real desktop regressions** in my first pass (e.g. `sm:flex-row` silently adding a `flex-direction` that a bare `<div>` never had, and `text-sm … lg:text-base` introducing a font-size where none existed). All were rewritten into `max-*` form.

The compiled CSS was then checked directly to confirm the scoping is genuine:

```
max-lg\:text-sm         -> @media not all and (min-width:1024px)
max-sm\:min-h-\[48px\]  -> @media not all and (min-width:640px)
```

A permanent regression test (`lib/navigation/mobile-nav.test.ts`) asserts the mobile CSS layer never restyles a pre-existing class outside a below-lg media query.

---

## 2. Every file changed

### New — PWA core

| File | Purpose |
|---|---|
| `app/manifest.ts` | Typed Web App Manifest → `/manifest.webmanifest`. Name, icons (incl. maskable), `standalone`, `portrait-primary`, theme/background colours, 3 long-press shortcuts. Typed so it can't drift from the icons on disk. |
| `public/sw.js` | Hand-written service worker. Network-first navigations w/ offline fallback; cache-first immutable `/_next/static`, fonts, images (bounded to 60); stale-while-revalidate CSS/JS. **API, auth and admin routes are never cached, and authenticated HTML is never persisted** — per-user roadmaps and scores must not leak between accounts on a shared device. |
| `components/pwa/service-worker-registrar.tsx` | Registers the worker on `load` (protects LCP), auto-activates waiting workers so users never sit on a stale build, and unregisters in dev. |
| `components/pwa/install-prompt.tsx` | Custom banner. Captures `beforeinstallprompt` on Chromium; shows Add-to-Home-Screen instructions on iOS (which never fires that event). "Not now" snoozes 14 days; once installed it never returns. |
| `app/offline/page.tsx` + `retry-button.tsx` | Static, precached offline shell. Retry button uses `useSyncExternalStore` on `navigator.onLine`. |
| `public/icons/*` + `app/favicon.ico` | Generated icon set: 192/256/384/512 `any`, 192/512 `maskable` (mark inside the 80% safe zone), 180px apple-touch-icon, favicons, multi-res `.ico`. |
| `scripts/generate-pwa-icons.mjs` | Reproducible icon generation from the brand SVG. |

### New — mobile navigation

| File | Purpose |
|---|---|
| `lib/navigation/mobile-nav.ts` | Single source of truth for tab bar + hamburger, so they can't drift. Carries **serializable icon names, not components** — it's imported by the server-rendered header, and passing a component across the RSC boundary is a build error (this actually broke the build once). |
| `components/mobile/nav-icons.tsx` | Client-side name → Lucide component map. |
| `components/mobile/mobile-top-bar.tsx` | Logo · notifications (with unread badge) · avatar · hamburger. `lg:hidden`. |
| `components/mobile/mobile-nav-sheet.tsx` | Hamburger slide-over (shadcn Sheet). Primary + secondary sections, identity block, Logout. |
| `components/mobile/mobile-tab-bar.tsx` | Fixed bottom bar, 5 tabs, safe-area aware. Adds `has-mobile-tabbar` to `<body>` to reserve space. |
| `components/mobile/mobile-profile-sheet.tsx` | Bottom-sheet counterpart to the desktop dropdown. |
| `components/mobile/pull-to-refresh.tsx` | Native-feel PTR. Arms only at `scrollY === 0`, resistance curve, `router.refresh()` (no reload → scroll and client state survive). Off at `lg+` and under reduced-motion. |

### New — reusable primitives

| File | Purpose |
|---|---|
| `components/ui/sheet.tsx` | shadcn Sheet on Radix Dialog — focus trap, scroll lock, Escape, `aria-modal` for free. All 4 sides safe-area padded. |
| `components/responsive/responsive-primitives.tsx` | `PageContainer`, `ResponsiveGrid`, `ActionRow`, `ResponsiveTable`, `MobileOnly`/`DesktopOnly` — so pages stop hand-rolling breakpoints. |
| `components/responsive/skeleton.tsx` | Skeleton set shaped like the real layouts (no CLS on swap). |
| `app/{dashboard,roadmap,learning-hub,community}/loading.tsx` | Route-level skeletons replacing spinners. |

### Modified

| File | Change |
|---|---|
| `app/layout.tsx` | Added PWA metadata, `appleWebApp` (standalone + `black-translucent` status bar), icons, and `viewport` with **`viewportFit: "cover"`** — without it `env(safe-area-inset-*)` is always 0. Zoom left enabled (capping it fails a11y). **Existing title/description untouched → SEO unaffected.** |
| `app/globals.css` | +210 lines: Sheet keyframes, safe-area utilities, skeletons, and the below-lg block (48px targets, 16px inputs, 16px card radius, heading scale, overflow guards, tab-bar offset, modals→bottom sheets). |
| `components/site-header.tsx` | Mobile chrome added; the desktop row's **only** change is its wrapper gaining `hidden … lg:flex`. Inner markup is byte-identical. Reuses data the header already fetched → zero extra queries. |
| `app/dashboard/page.tsx` | Hero height/stacking/full-width buttons, 1→2→4 stat grid, wrapping tags, blog grid, `PullToRefresh`. All via `max-*`. |
| `app/network/network-client.tsx` | Leaderboard `<table>` kept verbatim for desktop; below `lg` the same rows render as cards with labelled key/value pairs. |
| `app/roadmap/page.tsx` | Day tiles 7-across → 4-across on phones; full-width CTA; grid stacking. |
| `components/community/quick-post-modal.tsx` | Bottom sheet below `sm`. |
| `components/global-ai-assistant.tsx` | FAB lifted above the tab bar; panel safe-area padded. |
| `components/dashboard-greeting.tsx`, `community-layout-shell.tsx`, `articles/[slug]`, `learning-hub/layout`, `roadmap/day/[day]` | Typography scale + vertical rhythm, all `max-*`-scoped. |

---

## 3. Why not `next-pwa`

You asked for it, and I flagged the conflict before starting. `next-pwa@5.6.0` is a **Webpack-only** plugin, unmaintained since 2022, and this app builds with **Next 16.2.11 + Turbopack**. Installing it would have forced `next build --webpack` — a build-pipeline change with real breakage risk, against your "no breaking changes" requirement.

The hand-written worker delivers the same guarantees (precache, offline, runtime caching, update flow) with zero build coupling. If you later want Workbox, `@serwist/next` is the maintained successor.

---

## 4. Verification

```
Build        ✓ Compiled successfully (Turbopack)
TypeScript   ✓ 0 errors
Tests        ✓ 164 passed (21 files) — 10 new
Lint         8 errors → 2 (both pre-existing in scroll-reveal.tsx)
Desktop      ✓ 45/45 elements identical at >=1024px
Manifest     ✓ all required fields, 192+512, maskable, standalone
Endpoints    ✓ /manifest.webmanifest /sw.js /offline /icons/* → 200
```

### On the Lighthouse targets

Everything Lighthouse checks for **installability is verified above** and will pass: manifest with required fields, 192+512 icons, maskable variants, a fetch-handling service worker, offline fallback, `theme-color`, and apple-touch-icon. (Note: Lighthouse retired the standalone "PWA" category in v12 — these are now installability audits.)

**Performance >95 I can't certify from here** — this sandbox blocked the Chromium download, and the score depends on production hosting, network and real Supabase latency. What's in place to support it: deferred SW registration, lazy/async images, skeletons sized to prevent CLS, cache-first immutable assets, and no added render-blocking CSS/JS. Run Lighthouse against your deploy preview; the dominant remaining variable is server response time on the `force-dynamic` dashboard routes.

---

## 5. Worth knowing

- **`start_url` is `/dashboard`.** Best for daily-active students, but signed-out users hitting it get redirected to sign-in by the proxy. Change to `/` in `app/manifest.ts` if you'd rather optimise the first-launch case.
- **Settings** points to `/community/profile/avatar` (the closest existing route). Repoint when a real settings page exists.
- **Sheet needed `@radix-ui/react-dialog`** — the one dependency added. I avoided `tailwindcss-animate` on purpose: it remaps Tailwind's core `duration-*` utilities onto `animation-duration`, which would have altered existing desktop transitions. Keyframes are hand-written instead.
