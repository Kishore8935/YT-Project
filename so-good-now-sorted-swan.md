# Plan: Turn the YouTube clone into a portfolio-grade backend project

## Context

The project today is a working but minimal YouTube clone:
- **Backend** ([backend/index.ts](backend/index.ts)) — a single ~200-line Express file. JWT auth (inline `getUserId`, no middleware), bcrypt, zod validation, Prisma + Postgres (Neon), and a working R2 presigned-upload flow (`POST /api/upload-url`). Endpoints: signup, signin, list videos, get video, create video, get upload URL.
- **Models** ([backend/prisma/schema.prisma](backend/prisma/schema.prisma)) — `User` and `Uploads` only.
- **Frontend** — React 19 + react-router, basic screens (Landing, VideoPage, Signin, Signup, Upload).
- Uploads currently store a raw `videoUrl` that plays directly in a `<video>` tag — no processing.

**Goal:** make this a resume centerpiece that demonstrates real **backend engineering** — data modeling, REST API depth, async processing, and production deployment. Target: a **deployed, clickable demo** in a ~1-week sprint. The user picked focus areas: (1) core platform features, (2) advanced video pipeline, (3) production & DevOps.

**Reality check:** All three areas + deploy in one week is tight. This plan defines a **MUST** track that guarantees a deployed, impressive project, and a **STRETCH** track (the full multi-rendition HLS pipeline) layered on top. If the pipeline runs long, the MUST track alone is already a strong fresher portfolio piece.

---

## Foundation first (Day 1) — refactor the monolith, step by step (LEARNING MODE)

**How we work:** one step at a time. For each step I (a) explain the concept and why it matters, (b) make the change, (c) show how to verify it, then (d) **pause** for you before moving on. You're never clueless about what I'm doing.

The end goal is to split the single ~200-line [backend/index.ts](backend/index.ts) into a layered structure:
```
backend/src/
  config/env.ts        # zod-validated env
  lib/db.ts            # Prisma client (moved)
  lib/r2.ts            # S3/R2 client + presign helper (extracted)
  middleware/auth.ts   # requireAuth -> req.userId (replaces inline getUserId)
  middleware/error.ts  # asyncHandler + central error handler
  routes/auth.ts       # signup, signin
  routes/videos.ts     # video CRUD + upload-url
  app.ts               # express wiring (cors, helmet, json, routes, errors)
  index.ts             # bootstrap: app.listen
```

### The steps (each is one concept)

- **Step 0 — Read the current code together (no changes).** Spot the 4 weaknesses: everything in one file, no error handling (unhandled throw → ugly HTML 500, which we hit), auth logic inline in every route, env read directly with `!`. ~5 min, builds the "why."
- **Step 1 — Env config module (`config/env.ts`).** Concept: validate environment at startup with zod and fail fast with a clear message instead of a confusing crash later. Verify: rename a var in `.env`, see a readable error.
- **Step 2 — Extract clients to `lib/` (`db.ts`, `r2.ts`).** Concept: single-responsibility modules; one place that owns the DB/R2 connection. Verify: server still boots, `/api/videos` still 200.
- **Step 3 — Split `app.ts` from `index.ts`.** Concept: separate "build the app" from "start the server" so the app is importable (e.g. by tests) without opening a port. Verify: server boots identically.
- **Step 4 — `requireAuth` middleware.** Concept: Express middleware, `req`/`res`/`next`, attaching `req.userId`; replace the repeated inline `getUserId` calls. Verify: a protected route 401s without a token, works with one.
- **Step 5 — `asyncHandler` + central error middleware.** Concept: why async throws aren't caught by Express, and how a wrapper + one error handler give consistent JSON errors. Verify: trigger an error → clean JSON, not HTML.
- **Step 6 — Routers (`routes/auth.ts`, `routes/videos.ts`).** Concept: `express.Router()` to group and mount routes. Verify: every existing endpoint still works.
- **Step 7 — Ops & security middleware.** Concept: `helmet` (secure headers), `express-rate-limit` (abuse protection), `pino-http` (structured logs), and a `GET /health` endpoint for deploys. Verify: `/health` → 200; rapid auth calls get rate-limited.

Reuse: existing zod schemas, bcrypt/jwt logic, and the R2 client already in [backend/index.ts](backend/index.ts) — we're relocating, not rewriting.

---

## MUST track — Core platform features (Days 2–3)

This is where backend skill shows most: **data modeling + a broad, correct REST API**.

### Schema additions ([backend/prisma/schema.prisma](backend/prisma/schema.prisma))
- `Video` (rename/extend `Uploads`): add `description`, `views Int @default(0)`, `duration Int?`, `status VideoStatus @default(READY)`, `hlsUrl String?`, `visibility` enum (PUBLIC/UNLISTED). Keep `videoUrl` as the raw/source URL.
- `Comment` — id, text, userId, videoId, createdAt; relations + index on `videoId`.
- `Like` — userId, videoId, `type` enum(LIKE/DISLIKE); `@@unique([userId, videoId])` so a user has one reaction per video.
- `Subscription` — `subscriberId`, `channelId`, createdAt; `@@unique([subscriberId, channelId])`.
- `WatchHistory` — userId, videoId, watchedAt; index on userId.
- Add DB indexes on all foreign keys and on `Video.title` (for search) and `Video.createdAt`.
- Migrate with `bun --bun prisma migrate dev` (regenerates client too — recall the stale-client bug we hit).

### Endpoints (all write routes behind `requireAuth`, with owner-only authorization)
- **Comments:** `POST /api/videos/:id/comments`, `GET /api/videos/:id/comments` (paginated), `DELETE /api/comments/:id` (owner only).
- **Likes:** `POST /api/videos/:id/like` (toggle LIKE/DISLIKE/none), counts returned with video.
- **Subscriptions:** `POST /api/channels/:id/subscribe` (toggle), `GET /api/me/subscriptions` (feed of recent videos from subscribed channels). Update `User.subscriberCount` transactionally.
- **Views + history:** `POST /api/videos/:id/view` increments `views` and records `WatchHistory` (dedup per user within a short window). `GET /api/me/history`.
- **Search:** `GET /api/videos?search=...` (Postgres `ILIKE`, upgrade to `tsvector` if time).
- **Pagination:** cursor-based (`?cursor=&limit=`) on `GET /api/videos` and comments.
- **Channel page:** `GET /api/channels/:id` → channel info + paginated videos + subscriber count.
- **Authorization:** add owner checks on update/delete video & comment (returns 403 otherwise).

### Frontend (minimal, just enough to demo each feature)
Wire new screens/components: comments list+box on [VideoPage](frontend/src/screens/VideoPage.tsx), like/subscribe buttons, a Channel page, search bar in [Appbar](frontend/src/components/Appbar.tsx), and Sign in/Sign up/Upload nav links + logged-in state. Add an auth guard on `/upload`.

### Lightweight quality includes (fold in, don't over-invest)
- **OpenAPI/Swagger** at `/api/docs` (via `swagger-ui-express` + a hand-written or zod-derived spec). This doubles as an **interactive backend demo** — ideal for a backend-focused portfolio, recruiters can exercise the API without the UI.
- A handful of **integration tests** (Vitest + supertest) on auth + one CRUD flow, to show testing literacy. Not full coverage.

---

## STRETCH track — Advanced video pipeline (Days 4–5)

The differentiator. Scope pragmatically; ship a smaller version rather than nothing.

**Architecture:** add a **BullMQ queue backed by Redis** and a **separate worker process**.
1. After a successful upload, `POST /api/videos` enqueues a `transcode` job and sets `status = PROCESSING`.
2. Worker ([backend/src/worker.ts](backend/src/worker.ts)) pulls the job → downloads the source from R2 → runs **ffmpeg** → uploads results back to R2 → updates the `Video` row (`hlsUrl`, `duration`, `status = READY`).
3. Frontend plays the adaptive stream with **hls.js**; shows "Processing…" while `status = PROCESSING`.

**Tiered ambition (do them in order; stop when time runs out):**
- **Tier A (most realistic):** ffmpeg generates a **poster thumbnail** + extracts **duration**, single 720p re-encode to MP4. Demonstrates the full queue→worker→storage→DB loop. ~half a day.
- **Tier B:** multi-rendition **HLS** (360p/480p/720p) with a master playlist for true **adaptive streaming**. The "wow" version. Upload all segments + playlists to R2.
- **Tier C (only if ahead):** progress reporting (job % back to client via polling `status`), retry/backoff on failure.

**Deployment implication (important):** the worker needs the **ffmpeg binary** — its Docker image must `apt-get install ffmpeg`. Redis via **Upstash** (free tier). This is the trickiest thing to deploy; budget for it.

---

## DevOps & deploy (Days 6–7)

### Containerize
- `backend/Dockerfile` (API) and `backend/Dockerfile.worker` (API image + ffmpeg) — or one image, two start commands.
- `docker-compose.yml` for local dev: api, worker, redis, postgres. Documents the whole system in one file (great README artifact).

### CI
- `.github/workflows/ci.yml`: install (bun), typecheck, run tests, build Docker images on push/PR.

### Deploy live (recommended stack — all have free tiers)
- **Postgres:** Neon (already in use).
- **Redis:** Upstash.
- **Object storage:** Cloudflare R2 (already in use). Note: production CORS on the bucket must allow the deployed frontend origin (we already have the localhost policy).
- **API + Worker:** Render (supports Docker web service + background worker) or Railway.
- **Frontend:** Vercel or Cloudflare Pages.
- Move all secrets to the host's env settings; keep [backend/.env.example](backend/.env.example) updated. **Rotate the R2 key + Neon password** before going public (they've been visible in chat).

### Polish
- **README** with: architecture diagram (the compose services), feature list, tech stack badges, screenshots/GIF, live demo + Swagger links, local setup. This is what recruiters actually read.
- A **seed script** (`bun run seed`) creating a demo user + a few processed videos so the live demo isn't empty.

---

## Suggested day-by-day (1-week sprint)

| Day | Work |
|-----|------|
| 1 | Refactor to layered structure; auth middleware, error handling, env validation, helmet/rate-limit/logging, `/health`. |
| 2 | Schema (comments, likes, subs, history, views) + migrate; comments + likes endpoints + minimal UI. |
| 3 | Subscriptions, views/history, search, pagination, channel page, owner authz; Swagger + a few tests. |
| 4 | Pipeline Tier A: Redis+BullMQ, worker, ffmpeg thumbnail+duration, status field, frontend "Processing" state. |
| 5 | Pipeline Tier B: HLS multi-rendition + hls.js playback (drop to README "future work" if short on time). |
| 6 | Dockerfiles, docker-compose, GitHub Actions CI. |
| 7 | Deploy API + worker + Redis + frontend; production CORS; rotate secrets; README + seed + screenshots. |

---

## Verification (end-to-end)

After each phase, run locally then confirm in the deployed env:
1. **Foundation:** `bun run index.ts` boots; `GET /health` → 200; an intentional bad request returns clean JSON (not HTML). Rate limit triggers after N rapid auth attempts.
2. **Core features:** Sign up two users → user A uploads a video → user B comments, likes, subscribes → view count increments on watch → search finds the video → user B's history + subscription feed show it → user A can delete own comment, user B cannot (403). Exercise all of this through **Swagger UI** at `/api/docs`.
3. **Pipeline:** Upload a real `.mp4` → video appears as `PROCESSING` → worker logs show ffmpeg running → row flips to `READY` with `hlsUrl`/`duration` → frontend plays the HLS stream (network tab shows `.m3u8` + segment requests). Kill the worker mid-job and confirm the job retries/resumes.
4. **DevOps:** `docker compose up` brings up all services and the full flow works against them. CI passes on a PR. The deployed URL works from another device; uploads land in R2 and play back.

---

## Notes / decisions deferred

- **Auth hardening** (refresh tokens + httpOnly cookies) is valuable but optional for the sprint — current JWT-in-localStorage is acceptable for a demo; note it as "future work" in the README.
- **Frontend polish** is intentionally minimal — this is a backend showcase. If time allows after the MUST track, improve styling; otherwise Swagger UI carries the API demo.
- If the STRETCH pipeline can't be deployed in time (worker/ffmpeg friction), ship Tier A locally + a recorded GIF, and deploy the MUST track. Still a strong project.
