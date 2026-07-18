# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Dev server on :3000
npm run build         # Production build
npm run lint          # ESLint (lint:fix to autofix)
npm run type-check    # tsc --noEmit
npm run format        # Prettier write (format:check to verify)
npm run prepare       # Install Husky hooks (run once after npm install)
```

**There is no test framework in this project** — no Jest/Vitest/Playwright, no test files. Do not add test commands to docs or suggest running them. Verification here means `npm run type-check && npm run lint && npm run build`. The backend repo has the tests that cover this panel's contract (see below).

Pre-commit runs `lint-staged` (ESLint `--fix` + Prettier on staged files). Type checking is **not** in the hook, so run `type-check` manually — the strict flags below catch things ESLint won't.

## The backend: raf-bot-v2

This panel is a **customer-facing frontend with no database of its own**. Every piece of data comes from `raf-bot-v2`, a separate Express monolith at `C:\project\raf-bot-v2` (port 3100), pointed at per-site by `API_URL_<SITE>` (this panel is **multi-tenant** — one instance, several site backends; see Environment). It is an ISP/RTRW-Net system: WhatsApp bot (Baileys), admin panel, SQLite, plus GenieACS (TR-069) and MikroTik integrations. When a change here needs a new field or endpoint, the work is usually **in that repo**, not this one.

That repo has its own `CLAUDE.md` and `SYSTEM_MAP.md`. Read them before touching anything cross-cutting.

The authoritative contract between the two projects is a provider-side test in the backend repo:
`C:\project\raf-bot-v2\routes\__tests__\public-customer-api.contract.test.js` — it pins the response envelope and JWT claims for every customer endpoint, and its header names this panel. **Consult it before changing request/response shapes**; local `.md` files here have drifted (see Stale docs).

Customer endpoints live in `C:\project\raf-bot-v2\routes\public.js`, mostly on a sub-router mounted at `/api/customer` (guarded by `ensureCustomerAuthenticated`). Public ones (`/api/news`, `/api/announcements`, `/api/wifi-name`, `/api/auth/*`) sit on the main router.

### Response envelope — the normalization everything depends on

The backend replies `{ status: number, message: string, data: T }` (via its `lib/response-helper.js`). Both API clients here normalize that to `{ success: boolean, data?: T, message?: string }`, where `success = status >= 200 && status < 300`.

Two consequences that cause real bugs:

- Backend **errors omit `data` entirely**. `routeFromApiResponse` in [route-response.ts](src/lib/route-response.ts) treats `data === undefined` as failure, which is deliberate — don't "fix" it by defaulting `data` to `{}`.
- `status` in the body is the numeric HTTP code duplicated, not a string like `"ok"`.

## Architecture

Data flow, browser inward:

```
Client Component ─┬─ server action  ─┐
                  └─ fetch("/api/…") ─┤ (Next route handler)
                                      └─→ src/services/*.service.ts
                                            └─→ serverApiClient ──Bearer──→ raf-bot-v2:3100
Server Component ───→ server action ──────────┘
```

**The panel is a BFF.** The browser never talks to raf-bot-v2 directly — it hits Next.js route handlers or server actions, which call the backend server-side with the token. Preserve this: it's why the backend's CORS allowlist doesn't bite, and why the backend token is never exposed to client JS.

### Two API clients — do not mix them up

|         | [api-server.ts](src/lib/api-server.ts) `serverApiClient` | [api-client.ts](src/lib/api-client.ts) `apiClient` |
| ------- | -------------------------------------------------------- | -------------------------------------------------- |
| Runs in | Server components, server actions, route handlers        | Browser                                            |
| Targets | raf-bot-v2 for the session's site (`API_URL_<SITE>`)     | **Local Next routes only**                         |
| Auth    | Injects `Authorization: Bearer` from the session         | None (cookies ride along)                          |

`apiClient.buildUrl` **throws** on any absolute `http(s)://` URL. That guard is intentional — it enforces the BFF boundary. If you find yourself wanting to disable it, add a route handler instead.

### Layers

- `src/services/*.service.ts` — classes of `static` methods, one per backend domain, each owning its endpoint paths and types. All backend calls belong here; don't scatter raw `fetch` calls to the backend host.
- `src/app/api/**/route.ts` — BFF proxies for client-side fetching. Build responses with `routeSuccess` / `routeError` / `routeFromApiResponse` / `routeFromServerError` from [route-response.ts](src/lib/route-response.ts) rather than bare `NextResponse.json`, so cache headers and error logging stay consistent. Default is `no-store`; pass `cache: "revalidate"` for public, slow-moving data.
- `src/app/dashboard/_server/*` — the real server-action implementations, split by domain.
- `src/app/dashboard/actions.ts` — a **thin `"use server"` re-export façade** over `_server/*`, plus the type re-exports. New server-side logic goes in `_server/`, then gets a passthrough wrapper here. Components import from `actions.ts`, not from `_server/` directly.

## Auth

Two NextAuth credential providers ([auth.ts](src/lib/auth.ts)), both JWT strategy, 7-day session:

- `"otp"` — phone number + OTP delivered over WhatsApp by the backend.
- `"username-password"` — bcrypt-checked by the backend.

Both call [auth.server.ts](src/utils/auth.server.ts), which posts to the backend (`/api/auth/otp/request`, `/api/auth/otp/verify`, `/api/auth/login`) and returns `{ token, user }`. The backend's token is stored on the NextAuth JWT as `backendToken`.

**The session callback deliberately does not copy `backendToken` onto `session.user`** — it stays in the encrypted JWT cookie. Server code reads it with `getBackendAccessToken()`, which re-reads the cookie via `next-auth/jwt`'s `getToken`. Keep it that way; exposing it would hand the browser a backend credential.

[middleware.ts](src/middleware.ts) protects everything except `/login`, `/api/auth`, and static assets. Note the app has two login paths: `src/app/(auth)/login/page.tsx` is the real one (route group → `/login`), while `src/app/auth/login/page.tsx` is a legacy stub that just redirects to it.

### Debugging 401s — the cross-repo gotcha

The backend signs customer tokens with the **`jwt` field in its `config.json`**, _not_ a `JWT_SECRET` env var (`JWT_SECRET` appears in the backend's `.env.example` but is read nowhere). It also verifies issuer **and** audience, defaulting to `raf-bot-v2` / `raff-panel-2`. A token minted under a different `CUSTOMER_TOKEN_AUDIENCE` is rejected. Default TTL is 12h — shorter than this panel's 7-day session, so a session can outlive its backend token.

## Environment

`.env` (server-only; no `NEXT_PUBLIC_*` is used anywhere):

- `API_URL_<SITE>` — raf-bot-v2 base URL per site, e.g. `API_URL_DANDER`, `API_URL_TANJUNGHARJO`. This panel is **multi-tenant**: one deployment (`client.rafnet.my.id`) serves every site, and each request is pinned to one backend by the session's `site` claim, chosen at login. The site registry is [sites.ts](src/lib/sites.ts) — add a site there and set its `API_URL_<ID>`. At least one must be set or the app degrades to config errors.
- `DEFAULT_SITE` — site used for pre-login branding, since a visitor's site is not known until they log in (defaults to the first registered site).
- `NEXTAUTH_SECRET` — **required**; [auth.ts](src/lib/auth.ts) throws at import time if missing.
- `NEXTAUTH_URL`

The `API_URL_<SITE>` hosts are the **only** external hosts this panel calls, and they are all the same kind of service — a per-site raf-bot-v2 — reached through the BFF, never from the browser. Which one an authenticated request hits is fixed by its `site` claim (see [Multi-tenant routing](#multi-tenant-routing)), so a customer can never address another site's backend. There was once a `GENIEACS_URL` here; it was never read in `src/` and has been removed because it implied a direct GenieACS path that does not exist. WiFi operations reach GenieACS only through raf-bot-v2, which derives `device_id` from the authenticated customer's own row and validates the SSID index against their `allowed_ssids` — a customer cannot address someone else's device. If you find yourself adding an external host that is **not** a per-site raf-bot-v2, that is the BFF boundary breaking.

### Multi-tenant routing

One codebase, one running instance, N backends — selected per request, never mixed:

- **Registry**: [sites.ts](src/lib/sites.ts) maps each `SiteId` to its label and `API_URL_<ID>`. `getSiteApiUrl` **throws** on an unconfigured site rather than falling back — a misconfig must fail loudly, never silently route to the wrong tenant.
- **Login auto-detects the site**: customers never pick a location. Both providers ([auth.ts](src/lib/auth.ts)) fan out across every site's backend (`fanOutAuth` in [auth.server.ts](src/utils/auth.server.ts)) and let the backend that recognizes the customer win — OTP request/verify treat **404** ("not my customer") as "try the next site", password login treats **401** the same way, and the first backend to accept wins. That site is sealed into the JWT as `token.site`, immutable for the session (switching sites means logging out). Unreachable backends (5xx/timeout) are skipped but remembered, so a one-site outage never blocks the other site's customers.
- **Every backend call resolves from the claim**: `getBackendContext()` reads `{ baseUrl, token, site }` from the JWT in one shot; `serverApiClient` and the multipart upload services use it. Public/pre-login routes (news, announcements, wifi-name, company name) use `getPublicBackendBaseUrl()` — session site when logged in, else `DEFAULT_SITE` (pre-login branding, since no site is known until login).
- **Middleware** treats a session with no valid `site` claim (i.e. minted before this feature) like an expired one and forces re-login.
- **Cross-site isolation (backend action required)**: both backends default to issuer `raf-bot-v2` / audience `raff-panel-2`, so give each site a **distinct `jwt` signing secret** in its raf-bot-v2 `config.json`. Then a token minted for one site cannot verify against another even if routing were ever wrong — defense in depth behind the `site` claim.

## Enforced conventions

The Cursor rules (`.cursor/rules/rules.mdc`, `alwaysApply: true`) mirror `CODING_STANDARDS.md`. Most of it is standard TypeScript/React advice; what actually bites here:

- **`@typescript-eslint/no-floating-promises` is an error.** In `useEffect`, wrap with `void`: `void fetchData();`.
- **`no-console` allows only `warn`/`error`**, and the codebase convention is to gate logs behind `process.env.NODE_ENV === "development"` with a bracketed prefix (`[AUTH]`, `[API]`). Server-side, prefer `logPortalServerEvent` from [server-log.ts](src/lib/server-log.ts).
- **tsconfig is strict beyond the default**: `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` (indexed access is `T | undefined` — check before use), `noImplicitReturns`, `noImplicitOverride`. Prefix intentionally-unused bindings with `_`.
- Prettier: double quotes, semicolons, `trailingComma: "all"`, 2 spaces. ESLint also enforces `curly: all` and `eqeqeq`.
- Next.js 15: route `params` is a `Promise` and must be awaited.

## Known drift

Verified against the backend — these frontend service methods point at routes that **do not exist** on raf-bot-v2:

- **Live bug:** `SpeedBoostService.requestSpeedBoost` ([speed-boost.service.ts:134](src/services/speed-boost.service.ts:134)) posts to `/api/customer/speed-requests/request`, which 404s — the customer sub-router has `active`/`history`/`cancel` but no `request`. The backend's submit endpoint is `POST /api/request-speed`. This path is reachable: `actions.ts` → `_server/package-actions.ts:100`.
- **Dead code:** `PackageService.getBoostPackages` and `purchaseBoost` ([package.service.ts:67](src/services/package.service.ts:67)) target `/api/packages/boost[/purchase]`, which don't exist. Nothing calls them — the live `getBoostPackages` action uses `SpeedBoostService.getAvailableSpeedBoosts()` instead.
- **Dead code:** `NewsService.getNewsById` ([news.service.ts:31](src/services/news.service.ts:31)) targets `/api/news/:id`; that path exists only as an admin POST/DELETE. Never called.

Confirm against the backend's routes before assuming any of these work.

### Stale docs

The root `.md` files are informative but have drifted; trust the code and the backend contract test over them.

- `API_WORKFLOW.md` documents `NEXT_PUBLIC_API_URL` and client-side calls straight to the backend. Neither is real — `NEXT_PUBLIC_API_URL` is unused, and `apiClient` throws on absolute URLs.
- `API_WORKFLOW.md` also predates the `_server/` split and describes `useFormState` (React 19 renamed it `useActionState`).
