*This project has been created as part of the 42 curriculum by marcsilv, djoao, emonteir, aborges, achivela.*

# deepthought

An isometric, real-time multiplayer campus for 42 students — a persistent 2D world (built with Phaser) layered on top of a social platform: friends, DMs and room chat, project tracking with peer-help requests, a resource library, achievements/XP/leaderboards, and an admin/moderation panel. Everyone who signs in appears as a walking avatar on a shared isometric map of the campus, and the usual "social network" features (chat, friends, notifications, profiles) happen in a sidebar next to that world instead of a stack of separate pages.

## Description

**deepthought** re-imagines the ft_transcendence brief as a virtual campus rather than a single game. Instead of one Pong table, the whole application lives inside a persistent isometric world where every connected user is a visible, moving character — and the standard social/platform features are built around that world:

- **Isometric multiplayer world** — a Phaser 4 scene rendering the campus as an isometric tile map; every logged-in user is a synced, moving avatar with a layered/customizable outfit, visible to everyone else connected in real time.
- **Authentication** — 42 OAuth2 (the primary flow, used to create the account) plus an email + password fallback for accounts that already exist, protected by an email OTP step.
- **Social** — global chat, private DMs, friend requests, blocking, presence ("online" dot + last-seen), and project invitations.
- **Projects** — a per-user project board (mirrors the student's 42 curriculum), status tracking, and a peer help request/offer system.
- **Resources** — a per-project file/link library with upload progress, image previews, and type/size validation.
- **Gamification** — XP, levels, unlockable achievements, and leaderboards.
- **Notifications** — a persisted, real-time notification center covering friend requests, messages, invitations, achievements, announcements, and admin actions.
- **Administration** — an admin/moderator panel for user management, banning, roles, and platform-wide announcements.

## Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2 (the `docker compose` CLI plugin)
- `make` and `openssl` (used to generate a local self-signed HTTPS certificate)
- A [42 intra OAuth application](https://profile.intra.42.fr/oauth/applications) (client ID + secret) — required for the primary sign-in method
- An SMTP-capable email account (e.g. a Gmail account with an [app password](https://support.google.com/accounts/answer/185833)) — used to send OTP codes

Everything else (Node.js, PostgreSQL, nginx) runs inside containers; nothing else needs to be installed on the host.

### Setup

```bash
git clone <repo-url> deepthought
cd deepthought
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local Postgres credentials (any values) |
| `DATABASE_URL` | Prisma connection string — keep the `postgres` hostname, only the user/password/db need to match above |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Long random strings for signing access/refresh tokens |
| `FORTY_TWO_CLIENT_ID`, `FORTY_TWO_CLIENT_SECRET` | From your 42 intra OAuth app |
| `FORTY_TWO_CALLBACK_URL` | Must exactly match the redirect URI registered on that 42 intra app — defaults to `https://localhost:8443/api/auth/42/callback` |
| `EMAIL_USER`, `EMAIL_PASS` | SMTP account used to send OTP codes |
| `FRONTEND_URL`, `CORS_ORIGINS`, `VITE_SERVER_ORIGIN` | Leave at the provided `https://localhost:8443` default unless deploying elsewhere |

### Run

```bash
make certs   # generates a local self-signed TLS cert (idempotent, safe to skip — `up` runs it anyway)
make up      # builds and starts postgres, backend, frontend and the nginx HTTPS proxy
make prisma-dev   # first run only: applies Prisma migrations + generates the client
```

Then open **https://localhost:8443** (your browser will warn about the self-signed certificate — that's expected for local dev; accept it to continue). All traffic (API, uploads, WebSockets, Vite HMR) is proxied through nginx over HTTPS, which is what the 42 intra callback URL above needs to match.

Useful commands:

```bash
make logs             # tail all container logs
make logs-backend      # tail just the NestJS logs
make studio            # open Prisma Studio at http://localhost:5555
make export-db          # dump the Postgres database to db_backups/backup.sql
make down              # stop and remove containers (keeps volumes/data)
make clean              # stop and remove containers *and* volumes (drops the DB)
```

With the stack running, `cd frontend && npx playwright install && npm run test:e2e` runs the cross-browser smoke suite (see [`BROWSER_SUPPORT.md`](BROWSER_SUPPORT.md)).

## Resources

Classic references used while building this project:

- [NestJS documentation](https://docs.nestjs.com/) — modules, guards, Passport strategies, WebSocket gateways
- [Prisma documentation](https://www.prisma.io/docs) — schema design, migrations, relations
- [Socket.IO documentation](https://socket.io/docs/v4/) — rooms, namespaces, connection lifecycle
- [Phaser 3/4 documentation & examples](https://phaser.io/learn) — scenes, tilemaps, isometric coordinate math, input handling
- [React documentation](https://react.dev/) and [React Router](https://reactrouter.com/)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/) — WebSocket API, `XMLHttpRequest` upload progress, `URL.createObjectURL`
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — password hashing, JWT, file upload security
- [42's own subject PDF](en.subject.pdf) — module catalog and mandatory-part requirements

### AI usage

AI assistance (Claude, via the Claude Code CLI) was used throughout the project, primarily for:

- **Scaffolding and boilerplate** — generating repetitive NestJS module/controller/service/DTO structure and Prisma schema drafts from a description of the desired data model, which a team member then reviewed and adjusted.
- **Debugging** — diagnosing runtime errors (e.g. NestJS dependency-injection cycles, Docker/nginx upstream DNS caching after container restarts, Prisma type mismatches after schema changes) by reading logs/stack traces and proposing fixes.
- **Gap analysis against the subject** — auditing the implemented feature set against the 42 modules catalog to identify which mandatory requirements and near-miss modules still needed work, and implementing the resulting fixes (HTTPS reverse proxy, `.env.example`, avatar upload, upload progress/preview, sorting, notification coverage, MODERATOR privileges) phase by phase.
- **This README** — drafting and structuring the document from the project's actual code (Prisma schema, routes, module list) and the team's own notes on roles and contributions.

AI output was not merged blindly: each change was code-reviewed by a team member, and features were manually tested against the running application (including live browser verification with Playwright for UI-facing changes) before being committed. Architectural and product decisions (what to build, which modules to target, how the world/social features should behave) were made by the team, not delegated to the assistant.

---

## Team Information

| Login | Role(s) | Responsibilities |
|---|---|---|
| **marcsilv** | Product Owner / Project Manager, Frontend Developer | Defined the product vision and prioritized features; coordinated the team; built the bulk of the UI: design system, cluster/avatar layout, tabbed chat sidebar, profile page, leaderboard, project board, resource sharing UI, admin panel, feedback page, and the legal page layouts; kept the browser console clean and the app responsive. |
| **djoao** | Tech Lead, Backend Developer | Owned technical decisions and architecture; designed the full Prisma schema; built the 42 API integration (XP/level/coalition/campus/project sync), profile endpoints, achievements unlock logic, leaderboard ranking, the project board CRUD + help-request system, resource upload/listing, and the admin account-management endpoints. |
| **emonteir** | Developer | Built the friendship system (requests, accept/decline, list, remove), user blocking and its privacy logic, project invitations, the frontend achievement badge display, the notifications dropdown, and the user search page; wired the social features end-to-end between frontend and backend and tested those interactions. |
| **aborges** | Developer | Built the full authentication stack: email + password sign-in, 42 OAuth integration, JWT access/refresh tokens, email-based 2FA (OTP), and the Privacy Policy / Terms of Service content. |
| **achivela** | Developer | Set up Socket.IO; built the chat system (DMs, room/cluster messages, global chat, persisted history, typing indicators, read receipts); built the real-time notification delivery (friend requests, new messages, project invitations) and the online/offline presence system; wired "view profile from a chat message". |

## Project Management

- **Roles** were assigned by pairing each person's strengths with the areas of the project they'd own end-to-end (frontend UI vs. backend domain logic vs. auth vs. social features vs. real-time/chat), with `marcsilv` doubling as PO and PM/Scrum Master given the team size.
- **Task organization**: work was broken down per feature area (see the table above) and tracked as GitHub Issues against the repository, with pull requests used for code review before merging into `main`.
- **Communication**: the team coordinated day-to-day over Slack, with regular syncs to review progress, unblock each other, and re-prioritize the remaining module work against the subject's point requirements.

---

## Technical Stack

### Frontend
- **React 19** + **TypeScript** — component-based SPA
- **Vite** — dev server and build tooling (with HMR proxied through nginx)
- **React Router 7** — client-side routing
- **Tailwind CSS** — utility-first styling and the project's design system
- **Phaser 4** — the isometric multiplayer world (tilemap rendering, camera, input, sprite animation)
- **Socket.IO client** — real-time transport for the world, chat, and notifications

### Backend
- **NestJS 11** (Node.js/TypeScript) — modular architecture (controllers/services/modules), guards for auth (`JwtAuthGuard`, `RolesGuard`), Passport strategies (JWT, 42 OAuth2)
- **Socket.IO** — two gateways: one for world/presence sync, one for chat
- **Prisma 6** — ORM and migrations against PostgreSQL
- **class-validator / class-transformer** — request DTO validation on every endpoint
- **bcrypt** — password hashing
- **nodemailer** — OTP email delivery

### Database
- **PostgreSQL 16** — chosen for its strong relational guarantees (foreign keys, unique/composite constraints, transactions) which map cleanly onto the project's relational domain (users, friendships, projects, chat rooms, notifications) and for first-class support in Prisma.

### Infrastructure
- **Docker Compose** — orchestrates Postgres, the NestJS backend, the Vite frontend, and an nginx reverse proxy as a single `make up`
- **nginx** — TLS termination (self-signed local cert) and reverse proxy for the API, static uploads, WebSocket upgrades (`/socket.io/`), and the Vite dev server/HMR — this is what makes every browser↔backend connection HTTPS, including in local development
- **Docker's embedded DNS resolver** — nginx re-resolves upstream hostnames per request (instead of caching an IP at config-load time) so it survives `docker compose restart backend` without a stale-upstream 502

### Testing
- **Jest** — backend unit tests (`backend/src/**/*.spec.ts`)
- **Playwright** — cross-browser end-to-end smoke suite (`frontend/e2e/`), see [`BROWSER_SUPPORT.md`](BROWSER_SUPPORT.md)

### Justification for major technical choices
- **NestJS over a minimal framework (Express/Fastify)**: the project has enough distinct domains (auth, users, friendships, projects, resources, chat, notifications, admin) that Nest's module system, dependency injection, and guard/decorator-based auth kept that surface organized instead of turning into a pile of ad hoc Express middleware.
- **Prisma over a raw SQL/query builder**: a 17-model relational schema with many foreign keys benefits from Prisma's generated, type-safe client and its migration history, catching relation mistakes at compile time instead of at runtime.
- **Phaser for the world instead of a custom canvas/WebGL renderer**: isometric tilemaps, camera control, sprite layering, and input handling are all solved problems in Phaser; writing them from scratch would have consumed the time budget that instead went into the social/platform features.
- **nginx as a reverse proxy rather than TLS termination in Node**: keeps certificate/TLS configuration out of application code, gives one place to route `/api`, `/uploads`, `/socket.io`, and the Vite dev server, and matches how this stack would realistically be deployed.

---

## Database Schema

The schema (`backend/prisma/schema.prisma`) has 17 models. Core relations:

```
User ─┬─< UserProject >─┬─ Project ─┬─< Resource
      │                 │           ├─< ProjectInvitation >─ User (inviter/invitee)
      │                 ├─< ProjectHelpRequest              └─< ChatRoom (type=PROJECT)
      │                 └─< ProjectHelpOffer
      ├─< UserAchievement >─ Achievement
      ├─< Friendship >─ User (requester/addressee, self-relation)
      ├─< Notification
      ├─< Announcement ─< AnnouncementRead
      ├─< Feedback
      ├─< ChatRoomParticipant >─ ChatRoom ─< Message
      └─< Resource (uploader)
```

| Model | Purpose | Key fields |
|---|---|---|
| `User` | Account/profile | `fortyTwoId` (unique, from OAuth), `login`/`email` (unique), `passwordHash?` (email login), `role` (`USER`/`MODERATOR`/`ADMIN`), `level`/`xp`/`evalPoints`, `avatar`, `characterLayers` (JSON, world sprite outfit), `lastSeenAt` (presence), `isBanned` |
| `Project` | A 42 curriculum project | `name`/`slug` (unique) |
| `UserProject` | A student's status on a project | `status` (enum), `finalMark`, `needHelp`; unique on `(userId, projectId)` |
| `ProjectHelpRequest` / `ProjectHelpOffer` | Peer-help system on a `UserProject` | `isResolved`, `message` |
| `ProjectInvitation` | Invite a friend to a project | `status` (`PENDING`/`ACCEPTED`/`REJECTED`) |
| `Achievement` / `UserAchievement` | Gamification | `xpReward`; unique on `(userId, achievementId)` |
| `Resource` | Shared link or uploaded file, scoped to a project | `type` (enum incl. `FILE`), `url`, `fileSize`, `originalName` |
| `Friendship` | Friend graph (self-relation on `User`) | `status` (`PENDING`/`ACCEPTED`/`BLOCKED`); unique on `(requesterId, addresseeId)` |
| `Notification` | Persisted, typed notifications | `type` (8-value enum incl. `SYSTEM`), `data` (JSON, actionable payload), `isRead` |
| `Announcement` / `AnnouncementRead` | Platform-wide announcements + per-user read state | `pinned`; unique read per `(userId, announcementId)` |
| `ChatRoom` / `ChatRoomParticipant` / `Message` | Chat (global/private/project rooms) | `ChatRoomParticipant.lastReadAt` (read receipts), `Message.editedAt`/`deletedAt` |
| `Feedback` | User feedback submissions | `message` |

All cross-user relations that should disappear with the account (friendships, messages, notifications, project memberships, etc.) use `onDelete: Cascade`.

---

## Features List

| Feature | Description | Owner(s) |
|---|---|---|
| Isometric multiplayer world | Real-time synced avatars on a Phaser isometric campus map, with layered/customizable character sprites and touch support | marcsilv (layout/avatar), backend sync in `world.gateway.ts` |
| 42 OAuth sign-in | Full OAuth2 flow against the 42 intra API, account creation/sync on first login | aborges |
| Email + password sign-in | Secondary login for existing accounts, protected by an email OTP step, with JWT access/refresh tokens | aborges |
| Profile page | View/edit own profile (display name, bio, avatar upload, character customization); view others' public profiles | marcsilv (UI), djoao (endpoints) |
| Friends & blocking | Send/accept/decline friend requests, list/remove friends, block/unblock with privacy enforcement (blocked users get a limited profile view) | emonteir |
| Presence / online status | Live online/offline indicator and "last seen" on friends, driven by WebSocket connection state | djoao (backend), marcsilv (UI) |
| Global + private + room chat | Real-time chat with persisted history, typing indicators, and read receipts | achivela |
| Notifications | Persisted, real-time notification center covering friend requests, messages, invites, achievements, announcements, and admin actions | emonteir (UI), achivela (delivery), djoao (SYSTEM coverage) |
| Project board | Track status of each 42 curriculum project, request/offer help from peers, send project invitations | djoao (backend), emonteir (invitations) |
| Resource sharing | Per-project link/file library with client+server validation, upload progress bar, and image thumbnail preview | djoao (backend), marcsilv (UI) |
| Achievements, XP & leaderboards | Unlockable achievements, level/XP progression, ranking leaderboards | djoao |
| Admin & moderation panel | User search/sort, ban/unban, role management, platform-wide announcements; MODERATOR role can ban and post announcements, ADMIN-only for role changes and deletion | marcsilv (UI), djoao (endpoints) |
| Feedback page | Simple in-app feedback submission form | marcsilv |
| Legal pages | Privacy Policy and Terms of Service, linked from the app | marcsilv (layout), aborges (content) |
| HTTPS everywhere | nginx reverse proxy with TLS termination in front of the API, uploads, WebSockets and the dev server | djoao |

---

## Modules

Target: 14 points. Claimed here: **19 points**.

| Module | Type | Points | Team member(s) |
|---|---|---|---|
| Use a framework for frontend **and** backend | Major | 2 | djoao (backend/NestJS), marcsilv (frontend/React) |
| Real-time features via WebSockets | Major | 2 | achivela (chat gateway), djoao (world gateway) |
| User interaction (chat + profiles + friends) | Major | 2 | achivela (chat), emonteir (friends), marcsilv (profile UI) |
| Standard user management & authentication | Major | 2 | aborges (auth), djoao (avatar/presence backend), marcsilv (profile UI) |
| Advanced permissions system | Major | 2 | djoao (RolesGuard, admin endpoints), marcsilv (admin UI) |
| Remote authentication with OAuth 2.0 | Minor | 1 | aborges |
| Use an ORM | Minor | 1 | djoao |
| Complete notification system for creation/update/deletion actions | Minor | 1 | achivela (delivery), djoao (SYSTEM coverage for announcements/admin/resources), emonteir (UI) |
| Advanced search with filters, sorting and pagination | Minor | 1 | djoao (backend), marcsilv (UI) |
| File upload and management system | Minor | 1 | djoao (backend), marcsilv (UI: progress bar + preview) |
| Module of choice — **Isometric Multiplayer Campus** | Major | 2 | djoao (sync backend), marcsilv (world/avatar layout), whole team (integration) |
| Module of choice — **Achievements & Gamification System** | Minor | 1 | djoao |
| Support for additional browsers | Minor | 1 | djoao (Playwright smoke suite, `BROWSER_SUPPORT.md`) |

### Module of choice (Major): Isometric Multiplayer Campus

**Why we chose it.** The subject's example projects are all built around a single game table. We wanted the platform itself to feel alive — instead of a friends list and a chat box in a sidebar with nothing behind them, every logged-in user is a visible character walking around a shared campus, which is what actually makes "who's online right now" feel real rather than a status dot.

**Technical challenges it addresses.**
- *Real-time movement sync*: `world.gateway.ts` accepts `player:move` events, tracks connected players in-memory, and broadcasts position updates to every other connected socket; `handleConnection` sends a full snapshot of already-connected players so a client joining mid-session sees everyone immediately, not just future movements.
- *Presence lifecycle*: connect/disconnect are tied into the same gateway that drives the world, so "online" for the social features (friends list, chat) and "present in the world" are the same signal, backed by `RealtimeService.isUserConnected` and a persisted `lastSeenAt` for when a user is offline.
- *Phaser + React integration*: the game runs inside a React route (`PhaserGame.tsx`) while the chat/social/profile/admin panels are ordinary React components layered in a sidebar next to the canvas — the two have to share auth state (the JWT) and coexist without the Phaser render loop starving React's.
- *Isometric coordinate math*: `game/isometricUtils.ts` and `game/mapCoords.ts` convert between grid coordinates and the isometric screen projection for tile placement, depth sorting, and click-to-move input, plus a separate tile-based camera/zoom system (`setupCamera.ts`).
- *Character customization*: `characterLayers` (JSON on `User`) stores a per-user set of sprite layers (`CHARACTER_LAYER_ORDER` in `game/player.ts`) so each avatar is visually distinct and editable during character creation.
- *Mobile/touch input*: `setupInput.ts` and `deviceCapabilities.ts` handle touch-based movement so the world is usable on devices without a mouse.

**Value it adds.** It turns the platform from "a list of pages with a chat widget" into a single shared space — new users immediately see other students moving around, which is a much stronger sense of "who's here" than a numeric online count, and it gives the social and project-help features (block/friend/chat/invite) a concrete place to happen.

**Why it deserves Major status.** It's not a UI skin on top of existing data — it required a dedicated real-time sync protocol (separate from chat), server-authoritative connection/presence tracking, isometric-projection math, sprite-layer composition, a tilemap/camera system, and touch input handling, all coordinated between a Phaser render loop and the surrounding React app. It's the single largest subsystem in the codebase outside of the data model itself.

### Module of choice (Minor): Achievements & Gamification System

**Why we chose it.** The subject's example "Game statistics" minor requires a scored game, which this project deliberately doesn't have (see "Not implemented" below). Achievements/XP/leaderboards give the same sense of progression and competition the subject's example is going for, driven instead by real project/curriculum activity (completed 42 projects, level milestones, peer help given) rather than match results.

**How it was implemented.** `Achievement` and `UserAchievement` models track unlockable badges with an XP reward; a catalog of unlock criteria (`achievements.constants.ts`) evaluates a user's completed-projects count, level, accumulated evaluation points, and number of help offers given to peers; XP/level are stored on `User` and drive three leaderboard rankings (XP, level, achievement count); unlocking an achievement fires a persisted, real-time `ACHIEVEMENT_UNLOCKED` notification and a badge appears on the profile page.

**Value it adds.** Gives students a reason to keep the platform open beyond checking messages — a visible, DB-persisted record of curriculum progress, distinct from (and complementary to) 42 intra itself.

### File upload access-model note (relevant to the File upload minor)

Uploaded files (avatars and resource files) are served from `/uploads` **without authentication**, by design: `<img>` tags can't send a `Bearer` header, so avatars have to be publicly loadable, and resource download links need to keep working outside the SPA (e.g. pasted into an external chat). The access control that exists instead is the filename: every upload gets a random UUID v4 name (see `saveFile` in `backend/src/resources/file-upload.service.ts`), the directory isn't listable, and guessing an existing filename is infeasible. This is documented as an intentional trade-off, not an oversight — it's a "public but unguessable" model, appropriate for content that's meant to be shareable, and explicitly **not** a substitute for real access control on genuinely private files (there are none in this application).

### Support for additional browsers

Full compatibility with Firefox and Edge (Chromium-based, matching Chrome's engine), plus documented best-effort support for Safari — see [`BROWSER_SUPPORT.md`](BROWSER_SUPPORT.md) for the support matrix and known limitations (`dvh` viewport units needing Safari ≥15.4, Firefox's 32×32 custom-cursor size cap, and how the nginx HTTPS proxy fixed a cross-origin `download`-attribute caveat on resource files).

**How it was verified.** `frontend/e2e/smoke.spec.ts` (Playwright) drives sign-in, the email-login flow, the OTP page, the game canvas mounting, sending a chat message, and uploading + cleaning up a resource file — the same suite runs unmodified against Chromium, Firefox, and WebKit. Chromium and Firefox pass all 12 tests in this environment; WebKit's system dependencies couldn't be installed here (no root access in this sandbox — see `BROWSER_SUPPORT.md` for the one-line fix on a machine with `sudo`), so Safari stays "best-effort" rather than fully verified.

### Not implemented / not claimed

- **Any Gaming module** (web-based game, remote players, tournament, AI opponent, game statistics, second game): the world is a social/collaborative space, not a game with win/loss conditions, so none of the Gaming category's majors/minors are claimed — including "Game statistics", which explicitly requires a scored game.
- **Advanced chat features** (block-from-chat, invite-to-game-from-chat, chat-based tournament notifications): partially satisfied by existing features (blocking, chat history, typing indicators, read receipts, profile-from-message) but not claimed, since it also expects game invites/notifications that don't apply here.
- Accessibility (WCAG 2.1 AA), i18n/RTL, PWA/SSR, public API, analytics dashboard, GDPR tooling, AI/ML modules, blockchain, and the Cybersecurity WAF+Vault module: none attempted.

---

## Individual Contributions

**marcsilv** (PO/PM, Frontend) — Design system foundation (palette, typography, reusable components); the cluster/world layout and avatar presentation; the tabbed chat sidebar; the profile page (view + edit); the leaderboard page; the project board UI; the resource-sharing UI (including the upload progress bar and image preview); the admin panel UI (including the MODERATOR-aware role/delete controls); the feedback page; the legal page layouts; kept the browser console free of warnings/errors; made the app responsive across devices. Also acted as PO/PM: prioritized the module work needed to close subject gaps (HTTPS, `.env.example`, avatar upload, sorting, notification coverage, MODERATOR privileges) and coordinated the team through it.
*Challenge*: getting the Phaser canvas and the React sidebar to share layout/viewport responsively across desktop and mobile without the two fighting over input or resize events — solved by keeping Phaser's canvas sized independently and routing all UI chrome through ordinary React state instead of Phaser.

**djoao** (Tech Lead, Backend) — Full Prisma schema (17 models) and its migrations; the 42 API integration (XP/level/coalition/campus/completed-projects sync on login); profile endpoints (own + public); achievement unlock logic; leaderboard ranking endpoints; the project board (status CRUD, help requests/offers); resource upload/listing; the admin account-management endpoints (create/edit/delete/ban); plus the subject-gap-closure backend work: the HTTPS/nginx reverse proxy, avatar upload + presence tracking, upload-progress support, whitelisted sorting on users/admin/resources, SYSTEM notification coverage for announcements/admin actions/resources, and the MODERATOR role split.
*Challenge*: nginx caching a stale backend container IP after `docker compose restart backend`, causing intermittent 502s — solved by adding Docker's embedded DNS resolver plus variable-indirected `proxy_pass` so nginx re-resolves the upstream on every request instead of once at config load.

**emonteir** (Developer) — The friendship system (send/accept/decline, list, remove); user blocking and its privacy logic (blocked users get a limited profile and can't message); project invitations (send/accept/decline); the achievement badge display on the profile page; the notifications dropdown; the user search page; end-to-end testing of the social features.
*Challenge*: making the block relationship's privacy logic consistent everywhere a user's data is exposed (public profile, chat, friend lists) rather than just hiding the "message" button — solved by centralizing the blocked-check in the profile/friendship service layer instead of scattering it across UI components.

**aborges** (Developer) — The full authentication stack: email + password sign-in (for accounts that already exist via 42), 42 OAuth2 integration, JWT access + refresh tokens, email-based OTP as a second factor on email login, and the Privacy Policy / Terms of Service content.
*Challenge*: keeping the email-password path from becoming a way to create accounts outside of 42 (which the project's user model assumes) — solved by scoping email/password login to accounts that already have a `fortyTwoId` from OAuth, with OTP proving email ownership before a password can be set.

**achivela** (Developer) — Socket.IO setup; the full chat feature set (DMs, room/cluster messages, global chat, persisted history, typing indicators, read receipts); real-time notification delivery (friend requests, new messages, project invitations); the online/offline presence system; wiring "view profile from a chat message".
*Challenge*: keeping read receipts and typing indicators correct across multiple simultaneous chat rooms per user (global + every DM + every project room) without excess socket traffic — solved by scoping room membership and `lastReadAt` per `ChatRoomParticipant` row instead of a single global read-state per user.

---

## Known limitations

- Safari/WebKit is best-effort, not automatically verified — see [`BROWSER_SUPPORT.md`](BROWSER_SUPPORT.md).
- The `/uploads` access model is public-but-unguessable by design (see the note above) — not suitable for genuinely private files, of which this application has none.
- The isometric world currently supports one shared "campus" instance rather than per-cluster/per-room instancing.

## License / credits

Built as a school project for the 42 curriculum ft_transcendence subject. No license is granted for reuse outside that context.
