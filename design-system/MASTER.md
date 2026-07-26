# RAF NET Customer Portal — Design System (Master)

Global source of truth for UI work in this repo. Page-specific deviations, if any
are ever needed, go in `design-system/pages/<page>.md` and **override** this file;
absent such a file, these rules apply in full.

## Provenance — read this before regenerating anything

This file was written **from the shipped code**, not from `ui-ux-pro-max`'s
`--design-system` generator. That was deliberate. For this product the generator
returns:

- pattern **"Enterprise Gateway"** with a "Contact Sales" CTA and
  "Solutions by Industry" sections — a B2B marketing-landing pattern, wrong for a
  portal whose users are already authenticated;
- **"Dark mode" listed as an anti-pattern** — this app ships full, deliberately
  paired dark mode;
- fonts **Fira Code / Fira Sans** — the app already dropped unused font families
  for mobile performance (commit `660f07c`).

So: **do not run `--design-system --persist` over this file.** The skill is still
worth using here, in two other modes:

- `--stack nextjs|shadcn|react|html-tailwind` and `--domain ux` as a lint-style
  validation pass before a release;
- its Quick Reference §1–§3 (Accessibility, Touch, Performance) as a review
  checklist.

Note the skill's own `SKILL.md` "Available Stacks" table is out of date — it lists
only `react-native` and `javafx`, but the CLI supports `nextjs`, `shadcn`, `react`,
and `html-tailwind`.

## Token architecture

Three layers, in this order, defined in [`src/app/globals.css`](../src/app/globals.css):

1. **Semantic CSS variables** (`--background`, `--brand`, `--success`, …) under
   `:root` and `.dark`.
2. **Base element styling** (focus ring, headings, tabular figures, scrollbars).
3. **Component classes** (`.tile`, `.icon-chip`, `.brand-panel`, `.status-pill`, …).

Tailwind maps the variables to utilities in
[`tailwind.config.ts`](../tailwind.config.ts). Values are stored as bare HSL
channels (`210 40% 97%`) so Tailwind can apply opacity — `hsl(var(--brand) / 0.12)`.

> **Hard rule: no raw hex in components.** Every colour resolves through a token so
> light and dark stay in lockstep. Currently **zero** raw hex values exist in
> `src/components/**` and `src/app/**`. The one intentional exception is
> `viewport.themeColor` in [`layout.tsx`](../src/app/layout.tsx), which the CSS
> variable syntax cannot reach — see _Coupled values_ below.

### Colour tokens

| Role                 | Light         | Dark          | Notes                                                             |
| -------------------- | ------------- | ------------- | ----------------------------------------------------------------- |
| `--background`       | `210 40% 97%` | `222 47% 5%`  | Cool near-white / near-black navy, not pure black                 |
| `--foreground`       | `222 47% 11%` | `210 40% 98%` |                                                                   |
| `--card`             | `0 0% 100%`   | `222 32% 9%`  | Pure white card reads elevated without a heavy shadow             |
| `--muted-foreground` | `215 16% 42%` | `215 20% 70%` | **4.6:1 light / 5.1:1 dark on `--card`** — AA for body copy       |
| `--brand`            | `201 92% 36%` | `199 95% 54%` | Darker than a stock tech-blue so brand text clears 4.5:1 on white |
| `--brand-2`          | `188 88% 38%` | `187 92% 52%` | **Gradient-only.** Never use for text                             |
| `--success`          | `152 62% 31%` | `152 62% 48%` |                                                                   |
| `--warning`          | `32 92% 38%`  | `38 95% 58%`  |                                                                   |
| `--destructive`      | `0 72% 47%`   | `0 72% 58%`   |                                                                   |
| `--ring`             | `201 92% 38%` | `199 95% 56%` | Focus ring only                                                   |

Dark mode is **lightened and desaturated within the same hue family**, never an
inversion. When adding a token, set both modes together and check contrast in each
independently.

### Elevation

Four steps only — `--shadow-1` … `--shadow-4`, exposed as `shadow-xs`,
`shadow-card`, `shadow-pop`, `shadow-overlay`, plus `shadow-brand-glow`. Shadows are
blue-shifted (`hsl(215 40% 20% / …)`); neutral-grey shadows look muddy over the cool
background. Dark mode gets its own deeper values rather than a washed-out reuse.

Do not introduce a fifth step or a one-off `box-shadow` — if nothing reads as flat,
the scale has failed.

### Radius

`--radius: 0.9rem`. Tailwind derives `sm` (−6px), `md` (−4px), `lg` (=), `xl` (+4px),
`2xl` (+10px). Use the scale, not arbitrary values.

### Typography

- **Plus Jakarta Sans**, one variable font for the whole app, self-hosted by
  `next/font` (no runtime request to Google), `latin` subset, `display: "swap"`,
  exposed as `--font-sans`.
- Headings `h1`–`h4` carry `letter-spacing: -0.02em`; body copy keeps default
  tracking.
- `.tabular`, `th`, `td` get `font-variant-numeric: tabular-nums` so figures never
  reflow as digits change (uptime, byte counts, countdowns).
- `.eyebrow` — 11px uppercase, `tracking-[0.09em]`, muted.

### Motion

- Easing token `emphasized` = `cubic-bezier(0.22, 1, 0.36, 1)` for entering
  elements; `ease-in` for exits.
- Micro-interactions **200–220ms**; `fade-up` entrance 420ms.
- Animate **transform/opacity only**. `ping-ring` scales an absolutely-positioned
  element inside a fixed-size box precisely so it cannot nudge the label beside it.
- `prefers-reduced-motion: reduce` collapses all animation and transition durations
  globally at the bottom of `globals.css`. Anything new inherits this — do not add
  a JS-driven animation that bypasses it.

## Interaction contract

- **Touch targets ≥44px.** `Button` `size="default"` is `h-11` (44px) so this holds
  by default rather than by remembering to opt in. `size="icon"` is 44×44.
  `size="icon-sm"` is 36px _visually_ but expands its hit area to 44px via an
  `after:-inset-1` pseudo-element — use it only where the caller's container has
  ≥6px padding, or the bleed gets clipped by an `overflow-hidden` ancestor.
- **Press feedback**: every button variant carries `active:scale-[0.97]`; tiles use
  `active:scale-[0.985]`. `-webkit-tap-highlight-color` is cleared because these
  replace it.
- **Hover is desktop-only.** All hover lifts sit inside
  `@media (hover: hover) and (pointer: fine)` so touch devices never get a stuck
  `:hover`. Never make hover the only route to an action.
- **Focus**: one global `:focus-visible` rule — 2px `--ring` outline, 2px offset.
  Never remove it per-component.

## Status and semantic colour

`StatusPill` / `StatusDot` ([`ui/status.tsx`](../src/components/ui/status.tsx)) take
a `tone` of `online | offline | pending | neutral`.

> **Hard rule: colour never carries meaning alone.** The dot is `aria-hidden`; the
> visible text label carries the state. Same for the traffic bars, which pair colour
> with an icon plus a written label and expose `role="img"` with an `aria-label`.

## Layout

- `.px-gutter` is the app's horizontal rhythm: `max(1rem, env(safe-area-inset-left))`,
  widening to 1.5rem ≥640px and 2rem ≥1024px. Use it instead of repeating
  `px-4 sm:px-6 lg:px-8` at every level.
- `.pb-safe` = `env(safe-area-inset-bottom)` for the fixed bottom nav.
- `viewportFit: "cover"` in `layout.tsx` is **required** for `env(safe-area-inset-*)`
  to report anything but 0 on iOS. Removing it silently breaks every safe-area rule
  above.
- Breakpoints: `xs` 400px (added — lets a 2-up grid stay 1-up on an iPhone SE),
  then Tailwind defaults; container caps at 1400px.
- `min-h-dvh` on `body`, not `100vh`.

## Navigation

[`nav-items.ts`](../src/app/dashboard/nav-items.ts) is the **single source of truth**;
the desktop sidebar and the mobile bottom bar both derive from it, so they cannot
drift.

- `BOTTOM_BAR_SLOTS = 4`, plus a "Lainnya" overflow sheet — the 5-item bottom-nav
  limit is enforced structurally, not by convention, no matter how many optional
  features a site enables.
- Every nav item ships an icon **and** a text label.
- Adaptive: sidebar ≥`lg`, bottom bar below.
- Items carry `mobilePriority`; the overflow sheet keeps sidebar reading order
  because it is a menu, not a ranking.

## Component inventory

Primitives in `src/components/ui/`: `accordion`, `alert`, `alert-dialog`, `badge`,
`button`, `card`, `dialog`, `dropdown-menu`, `empty-state`, `info-row`, `input`,
`label`, `page-header`, `select`, `skeleton`, `stat-tile`, `status`, `switch`,
`tabs`, `textarea`, `timeline`.

Prefer composing these over new one-offs. Shared formatters live in
[`src/lib/format.ts`](../src/lib/format.ts).

### Fixed choices

- **Icons: `lucide-react`, one family, no exceptions, and no emoji as icons.**
  (ui-ux-pro-max defaults to Phosphor; Lucide is an accepted alternative and
  consistency matters more than which set.)
- **Toasts: `sonner` only** — mounted once in `layout.tsx` as
  `<Toaster position="top-center" richColors closeButton />`. The shadcn Radix toast
  stack (`ui/toast.tsx`, `ui/toaster.tsx`, `hooks/use-toast.ts`) and
  `react-hot-toast` were removed as dead code; do not reintroduce a second toast
  system. Use semantic methods: `toast.success(…)` / `toast.error(…)`, not bare
  `toast(…)`.
- **Theme: `next-themes`**, `attribute="class"`, `defaultTheme="dark"`,
  `enableSystem`, `disableTransitionOnChange`.
- **Charts: none.** `recharts` was removed as an unused dependency. The only data
  viz is a CSS stacked bar. If a real chart is ever needed, re-evaluate rather than
  assuming recharts.

## Coupled values — change these together

| If you change…                  | You must also change…                                | Why                                                           |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `--background` in `globals.css` | `viewport.themeColor` in `layout.tsx`                | Otherwise mobile browser chrome shows a seam against the page |
| `nav-items.ts` entries          | nothing — sidebar and bottom bar both derive from it | This is the point of the file                                 |
| A colour token                  | its counterpart in the other mode                    | Light/dark are designed as pairs                              |

## Pre-release checklist

Verification in this repo is `npm run type-check && npm run lint && npm run build`
— **there is no test framework**. On top of that:

- [ ] Contrast checked in light **and** dark independently (not inferred from one)
- [ ] Every new interactive element ≥44px hit area
- [ ] Icon-only controls have `aria-label`
- [ ] No colour-only state indicators
- [ ] `prefers-reduced-motion` still honoured by any new animation
- [ ] No raw hex introduced
- [ ] Checked at 375px, 768px, 1024px, 1440px
- [ ] No second toast/chart/icon library introduced
