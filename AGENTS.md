# Mefaitrien – how it works (for AI agents)

Nuxt 4 + Nitro app for a Dutch shared household/community. Members belong to a **cooking group**; each group cooks in turns, and after dinner two people wash up. Prisma (MariaDB, schema in [prisma/schema.prisma](prisma/schema.prisma)), Redis (via Nitro `useStorage("redis")`) caches computed points. UI strings and error messages are Dutch. Tests: `yarn test` (Vitest, `tests/`); Prisma is mocked, see `tests/helpers/`.

## Commands & layout
```bash
yarn dev          # prisma generate && nuxt dev (port 3000)
yarn devhost      # same, --host 0.0.0.0
yarn build        # prisma generate && nuxt build -> .output
yarn test         # vitest run (tests/**/*.test.ts)
yarn prisma:studio
```
`prisma generate` is needed after schema changes; `generated/` is gitignored. Docker builds the image and the entrypoint runs `prisma migrate deploy` from `/opt/prisma`.

| Path | What lives there |
|---|---|
| `server/api/**` | One file per method, path mirrors the URL (`[year]/[month]`); everything goes through `BaseEventHandler` except a few raw handlers |
| `server/utils/` | `auth.ts`, `handlers/baseEventHandler.ts`, `cookingPoints.ts`, `washingPoints.ts`, `longestEater.ts`, `functions.ts`, `profileImage.ts`, `deviceHub.ts`, `deviceCommand.ts` |
| `server/consts/redisKeys.ts` | `MFR:cookingpoints`, `MFR:washingpoints`, `MFR:longesteater:current` |
| `prisma/migrations-mariadb/` | **Active** migrations. `prisma/migrations/` is legacy SQLite — never add there |
| `types.ts`, `types/dto.ts` | `AllowType`, `SessionData`, `SessionEvent`, `ServerAuthConfig`; endpoint DTOs |
| `types/device.ts` | Device protocol types + runtime guards (`parseCommand`, `isDeviceState`, …) |
| `composables/`, `plugins/api.ts` | `useAPI`, session/cooking/pageInfo stores, toast, confetti |
| `components/Ui/` | Vendored shadcn-vue-style kit (ui-thing/Radix) — treat as generated |
| `components/base/**` | App components, auto-imported path-based (`base/authenticated/cooking/PointsMedal.vue` → `BaseAuthenticatedCookingPointsMedal`) |
| `tests/` | Vitest tests + `helpers/` (Prisma mock, Nitro globals, fake Redis) |
| `i18n/enumTranslations.ts` | Only "i18n": Dutch labels for enums (no vue-i18n) |

Aliases `~/`, `@/`, `~~/`, `@@/` all resolve to the project root (`srcDir: "."`); server code mixes them.

## Auth
Every API handler is `new BaseEventHandler(event, handlerFunc, yupSchema?).handle({ route, method, allowType, role? })` ([server/utils/handlers/baseEventHandler.ts](server/utils/handlers/baseEventHandler.ts)). It checks the Bearer JWT, loads the session (`event.session`), validates the body with the yup schema and puts the cast body in `event.data`. `allowType`: `ANYONE`, `AUTHENTICATED`, `ROLE` (any listed role; **ADMIN always passes**, role compare is case-insensitive). Roles: `USER`, `COOKING` (manages rosters/points), `ADMIN`. Inactive users (`isActive=false`) cannot log in, and `getSessionData` throws 401 for them, so their JWT stops working on authenticated routes.

JWT: `jsonwebtoken`, `{ id }`, 12 h, signed with `runtimeConfig.jwtSecret` (`NUXT_JWT_SECRET`). Login also stores it in `User.refreshToken` and logout nulls it (one token per user, but requests are not checked against it). Session shape (`SessionDataDto`): `id`, `name`, `username`, `cookingGroup` (**name**, not id), `roles: string[]`, `active`.

**Trap — the config is not routing.** When a config is passed, its `route`/`method` are documentation only. Only `.handle()` **without** an argument (e.g. `server/api/admin/status.get.ts`) falls back to `checkAccess()`, which matches `event.url.startsWith(route)` + method against `runtimeConfig.authMiddleware.routes` in `nuxt.config.ts`; a handler missing from that list returns 401. Prefix matching means `/api/admin` also covers `/api/admin/status`.

## Data model in one paragraph
`User` (belongs to at most one `CookingGroup`, has `cookingpointsBase` / `washingpointsBase` offsets). A `MonthRoster` (unique year+month, status `CANFILLIN` → members may submit availability, `NOFILLIN` → closed, `ASSIGNED` → days assigned) has `BlockedDay`s (no dinner), `Availability` rows (per user/day: `UNAVAILABLE`, `NEGATIVE`, `POSITIVE`; no row = available) and `AssignedDay`s (day 1-31, **one cook per group per day**: `cookingGroupId`+`day`). Each `AssignedDay` may have **one** `WashingRegistration` (`assignedDayId` unique FK, no cascade) with two washers (`washUserOne/Two`) and `WashingRegistrationEatUser`s (who ate along, `amountEat` ≥ 1, includes guests). `WashingPenalty` = manual point adjustments per user.

## Cooking flow
1. COOKING/ADMIN creates a month roster (`roster/create`) with blocked days; members fill availability (`availability.post`, month is 1-12, only while `CANFILLIN`; replaces the user's rows for that month; duplicate days in one submit are rejected).
2. `roster/[y]/[m]/auto.post` **only previews** a proposal (writes nothing). Per group, per Mon–Sun week: first match distinct cooks to days (bipartite matching, lowest cooking points first), leftover days go to the lowest-score person. `UNAVAILABLE` excluded, `POSITIVE` = −2 cost, `NEGATIVE` = +3 cost, each assignment adds +1 to a running score. Current/future months only consider active users; past months include everyone. 409 if nobody is available on a day.
3. `roster/[y]/[m]/assign.post` saves the (possibly hand-edited) assignment and sets status `ASSIGNED`. Body `{ groupId?, assignments: [{groupId,userId,day}] }`; with `groupId` only that group's days are replaced. It **syncs** instead of delete-all: unchanged days keep their id, changed cook is updated in place, new days created, removed days deleted — but a removed day that already has a washing registration → **409** (deleting it would violate the FK; this was a production bug). A blocked day may stay only when that cook is unchanged; a new or changed cook on a blocked day is 400.
4. **Cooking points** = `cookingpointsBase` + number of `AssignedDay`s of the user (all time). Lower = should cook sooner. Cached in Redis (`MFR:cookingpoints`), call `invalidateCookingPoints()` after every `AssignedDay` change. Switching group (`group/assign.post`, `migrateUserCookingGroup`) and reactivating a user reset `cookingpointsBase` to *group average − own assignment count*, so they start at the group's average without losing history.

## Washing flow
- `washing/fill.get` lists past/today's assigned days of a group (cursor paginated, 10 per page) with their registration; `washing/fill.post` upserts the registration for a day (replaces washers and all eaters). Validation: day must exist (404); washers must be active (any group); eaters must be active **and in the day's cooking group**. Both washers may technically be the same person.
- `registrations/delete` (ADMIN) removes a registration and its eaters. After any registration change call `invalidateWashingPoints()` **and** `invalidateLongestEater()`.
- **Washing points** ([server/utils/washingPoints.ts](server/utils/washingPoints.ts)), per registration with `E` = total `amountEat`: each washer +`2+E`; each eater −`2×amountEat`; then every *active* user gets −`4/activeUsers` per registration (so the sum over active users is 0). No active users → computed points are 0 (no division by zero). Total = `washingpointsBase` + computed − penalties (sum of `WashingPenalty.amount`, negative amounts allowed, 0 rejected), rounded to 1 decimal. Higher = has done more washing, owes less. Penalties of inactive users are ignored; (de)activating a user invalidates the cache. `washing/points/base.post` (ADMIN) sets the base without cache invalidation (base is added on read). Cached in `MFR:washingpoints`.
- **Longest eater** ([server/utils/longestEater.ts](server/utils/longestEater.ts)): per cooking group, registrations sorted by (year, month, day). Only eating counts: a streak grows by 1 per meal they ate, including when they also cooked or washed. A meal they neither ate nor cooked/washed breaks it; cooking or washing alone neither extends nor breaks it. Best streak overall is shown on the cooking points page.

## Housemates moving group / becoming inactive
- **Group move**: `group/assign.post` and `admin/user.post` both rebase `cookingpointsBase` to *new group's average − own assignment count* (not when leaving to no group). Washing points don't depend on groups. Old `AssignedDay`/`WashingRegistration` rows keep their original group.
- Re-saving a month (`assign.post`) or a registration (`fill.post`) keeps working for people **already on it** who have since moved or gone inactive ("grandfathered"); anyone *new* must be in the group (cooks) / active (washers) / active and in the day's group (eaters).
- **Inactive**: can't log in, hidden from points pages, excluded from auto-assign for current/future months and from the washing averaging divisor; their assignments, registrations and cooking-point history stay. `assign.post` does not check `isActive`. **Reactivation** rebases cooking points to the group average; washing points are simply recomputed from history (relative standing unchanged, absolute values shift with the active count). `getLongestEater` may still show an inactive user.

## Server conventions
- yup validates the **body only**; validate query/path params with a local schema (`getQuery`, `getRouterParams`). `event.data` is `any` — cast it. Validation failures become 400 with the yup message.
- Errors: `throw createError({ statusCode, statusMessage })`. 400 validation, 401 auth, 403 role guard, 404 missing row, 409 conflict (nobody available, day has a registration), 500 unexpected. New user-facing `statusMessage`s are **Dutch**.
- Use `$transaction` for multi-write invariants (`assign.post`, `admin/user.post`, registration delete) and re-check inside it what you read outside when it matters.
- Select/include narrowly and return the DTOs from `types/dto.ts` instead of ad-hoc shapes.

### Caches — always invalidate
| Change | Call |
|---|---|
| Any `AssignedDay` create/update/delete, roster assign | `invalidateCookingPoints()` |
| Registration create/update/delete, penalty add/delete, user (de)activation | `invalidateWashingPoints()` |
| Registration create/update/delete | `invalidateLongestEater()` |

Caches have **no TTL** and are read-through in `get*PointTotals`. Base points are added on read, so `points/update` and `washing/points/base` intentionally do not invalidate. A missed invalidation is the classic bug here.

## Frontend conventions
- Auth is `@sidebase/nuxt-auth` local provider: `POST /api/auth/login` returns `{ token: { bearer } }`, token cookie `auth.token`, `Authorization` header attached by [plugins/api.ts](plugins/api.ts). `globalAppMiddleware: true`; login page uses `definePageMeta({ auth: { unauthenticatedOnly, navigateAuthenticatedTo } })`. `app.vue` wraps pages in `AuthenticatedBase` (sidebar + navbar) only when authenticated.
- Data fetching: `useAPI<T>(url, options)` = `useFetch` wired to the authenticated `$api`; use it for GETs in setup/SSR. Use `useNuxtApp().$api` for **mutations** and imperative loads (pagination). Older pages pass `method/body` to `useAPI`; it works but `$api` is preferred. A 401 is not auto-redirected; pages show `error.data?.statusMessage ?? error.statusMessage` via `useSonner.error(...)` / `useSonner.success(...)` (alias of `vue-sonner`'s toast, configured in `nuxt.config.ts`).
- Every page calls `usePageInfoStore().setPageInfo({ title })` (navbar title) and `useSeoMeta({ title })`. Page markup is often large and inline; move reused pieces to `components/base/authenticated/**`.
- Stores: `useSessionStore` (wraps `useAuth`), `useCookingStore` (availability draft), `usePageInfoStore`.
- Navigation lives in `components/base/authenticated/SideBar.vue`; items have an optional `role`, ADMIN sees everything. A new COOKING/ADMIN page needs a sidebar item **and** a gated API.
- UI kit: auto-imported `Ui*` components (`UiButton`, `UiCard`, `UiDialog`, `UiSidebar*`, `UiVeeInput` for vee-validate/yup forms, `UiSelect`, `UiTable`, …). Icons: `<Icon name="lucide:...">`, spinners `svg-spinners:180-ring`. Toasts via `UiToastToaster` + `UiVueSonner`.
- Tailwind only (no scoped CSS in app pages); `tv()` from `tailwind-variants` is auto-imported, shared variants in `utils/shared.styles.ts`. Theme tokens `bg-card`, `text-muted-foreground`, `border-input`, `text-primary`; dark mode via `@nuxtjs/color-mode` (default dark). Keep mobile-first `min-w-0`, `overflow-x-hidden` and responsive `sm:`/`md:`/`xl:` grids — they are deliberate.
- **All UI copy, labels, toasts and new API errors are Dutch.** No vue-i18n; enum labels in `i18n/enumTranslations.ts`. SEO titles are Dutch too.
- Profile pictures: authenticated blob fetch `/api/account/avatar?userId=` (never a plain `<img src>` to it), upload posts `file: { name, type, size, lastModified, content }` (data URL, ≤1 MB, jpeg/png/webp/gif, magic bytes checked), then dispatches `profile-picture-updated`.

## Tests
- `tests/setup.ts` mocks `@@/lib/prisma` and replaces `BaseEventHandler` with `FakeBaseEventHandler` (skips auth, still validates/casts the body). `tests/helpers/nitro.ts` stubs Nitro globals (`useStorage` backed by an in-memory `redis` Map, `defineEventHandler`, `createError`, `getRouterParams`, `readBody`, `getQuery`); `tests/helpers/prisma.ts` is an auto-creating Prisma mock (`prismaMock.user.findMany` = `vi.fn()`), reset between tests.
- Declare `vi.mock(...)` **before** `const { default: handler } = await import("~/server/api/...")`, then call the handler with a plain `{ body, session, params, query }` event. Cache tests use the `redis` Map; pure logic tests call the util directly.
- When a foreign key matters (`assign.post.test.ts`), tests build a small in-memory DB with `vi.hoisted` that emulates the FK/`P2003` instead of only asserting mock calls.
- Add tests for every rule you touch: 400/401/404/409 paths, "writes nothing" on rejection, grandfathering, and cache invalidation.

## Env, operations, extras
- `.env` (see `.env.example`): `DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DB"` (must be `mysql:`; the adapter parses it), `NUXT_JWT_SECRET`, `FILE_STORAGE_MOUNT` (default `/media/storage`, avatars under `profile-images/`), `NUXT_DEVICE_ID`, `NUXT_DEVICE_PUBKEY` (base64 raw Ed25519 public key), `NUXT_BASE_URL`/`BASE_URL`, runtime `NUXT_REDIS_URI` (host only, port 6379).
- Device speaker: `/ws/device` upgrade requires `x-device-id`, `x-timestamp` (±120 s, strictly increasing) and `x-signature` (Ed25519 over `"<ts>\n<id>\nws"`); state/logs/replies live in the in-memory `deviceHub` (single instance only). `executeCommand` uses 10 s / 30 s timeouts; `/api/device/command` is ADMIN, `/api/device/preset` is AUTHENTICATED but pinned to `set_preset`.
- Calendar: `GET /api/calendar/{userId}/{hex64}.ics`, public by token (32 random bytes, regenerating revokes the old link), active users only, `no-store`.
- Formatting: Prettier (print width 100, double quotes, semicolons, 2 spaces, import + Tailwind class sorting). Some files are tab-indented — match the file you edit rather than reformatting whole files.

## Known quirks (don't "fix" silently)
- `washing/penalty.post` only requires `AUTHENTICATED`, not a role.
- `fill.post` does not check the day is in the past (only `fill.get` hides future days).
- Washing points assume washers are sane; same user as both washers gets points twice.
- `status.post` can set any status regardless of existing assignments.
- Points caches live in Redis without TTL: any code that changes assignments, registrations, penalties or active users must invalidate them.
- `auto.post` declares `method: "GET"` in its config (harmless today because a passed config is not used for matching).
- `admin/status.get.ts` calls `.handle()` with no config, so it depends on the `runtimeConfig.authMiddleware.routes` list; `device/events.get.ts` has no `BaseEventHandler` at all (device log is unauthenticated).
- `status.post` and `availability.post` validate month as 1–12; `assign.post` and `fill.post` do not check `isActive` for people already on the roster/registration.
