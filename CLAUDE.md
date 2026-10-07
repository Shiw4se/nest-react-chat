# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack real-time chat application with a NestJS backend and React/Vite frontend. Uses WebSockets (Socket.IO) for real-time communication, JWT for authentication, and Prisma with PostgreSQL for persistence.

## Commands

### Backend (`/backend`)

```bash
npm run start:dev       # Development with watch
npm run build           # Production build
npm run test            # Run all unit tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
npm run test:e2e        # End-to-end tests
npm run lint            # ESLint check
npx prisma generate     # Regenerate Prisma client after schema changes
npx prisma migrate dev  # Run migrations in development
npm run db:start        # Local PostgreSQL (embedded binaries, data in backend/.pgdata)
npm run db:stop         # Stop it; db:reset wipes the data directory
npm run db:seed         # Demo users/rooms/messages via ts-node (idempotent); db:seed:prod runs the built dist/seed/seed.js
```

The local database comes from the `embedded-postgres` dev dependency via `scripts/local-db.mjs`; it listens on 127.0.0.1:5432 as postgres/postgres, database `chat`. On Windows, start it from a normal terminal: when postgres is spawned from a sandboxed shell its child processes fail with "could not reserve shared memory region" (error 487).

Run a single test file:
```bash
npm run test -- --testPathPattern=rooms.service
```

### Frontend (`/frontend`)

```bash
npm run dev             # Vite dev server (proxies /auth and /socket.io to backend)
npm run build           # Production build
npm run test            # Vitest (run once)
npm run coverage        # Coverage report
npm run lint            # ESLint check
npm run format          # Prettier format
```

Run a single test file:
```bash
npm run test -- src/store/useAuthStore.test.ts
```

### Docker & deployment

`docker compose up --build` runs Postgres, the API (`backend/Dockerfile`: migrations + optional `SEED_DEMO` seed in `docker-entrypoint.sh`, healthcheck on `/v1/health`) and the SPA in nginx (`frontend/nginx.conf.template` proxies `/v1`, `/socket.io`, `/uploads`, `/docs`; the frontend is built with empty `VITE_API_URL` = same origin). `render.yaml` + `docs/DEPLOY.md` describe the free Render + Neon + R2 setup. `.gitattributes` keeps `*.sh`/Dockerfiles LF so they run in Linux containers when checked out on Windows.

### CI

GitHub Actions runs on push to `main` and PRs. For each package: install, `prisma generate` (backend), lint, build, unit tests, plus `test:e2e` on the backend. The e2e suite boots the app with `PrismaService` mocked, so it needs no database.

## Architecture

### Backend (NestJS)

**Module structure:** `AppModule` imports `AuthModule`, `ChatModule`, `MessagesModule`, `RoomsModule`, `UsersModule`, `PrismaModule`. `UsersModule` reuses `UserRepository` exported from `AuthModule`.

**Data flow for REST:** Controller → Service → Repository → PrismaService

**Data flow for WebSocket:** `ChatGateway` handles all real-time events. It depends on `RoomsService` and `MessagesService`, verifies the JWT itself in `handleConnection`, and carries its own `@UsePipes(ValidationPipe)` because global pipes from `main.ts` do not apply to gateways. Validation failures reach the client as an `exception` event.

**Key patterns:**
- **Repository pattern**: `RoomsRepository`, `MessagesRepository`, `UserRepository` abstract Prisma queries. Injected by token (`ROOMS_REPOSITORY`) so they can be swapped.
- **Cached repository**: `CachedRoomsRepository` wraps `RoomsRepository` with in-memory cache (30s TTL for public rooms). Provided as `ROOMS_REPOSITORY` token in `RoomsModule`.
- **Guards**: `JwtAuthGuard` (REST), `RoomAccessGuard` (REST room membership, read-only check). JWT tokens for WebSocket come from the socket handshake `auth` payload or `Authorization` header and are verified in `ChatGateway.handleConnection`.
- **Room access**: `RoomsService.checkRoomAccess` is a read-only check; `RoomsService.joinRoom` additionally records membership for public rooms and is what the socket `join` handler uses.
- **Profiles**: `User.displayName` and `User.bio` are optional. `/users/me` (GET, PATCH), `/users/me/password`, `/users/:userId`. Message authors and room members include `displayName`. A wrong current password returns 400, never 401, because the frontend logs out on any 401.
- **File storage** (`src/storage`, global): `ImageStorageService` re-encodes uploads with sharp (avatars: 256×256 WebP crop; chat images: longest side 1600, never upscaled) and hands them to the `FILE_STORAGE` driver. Re-encoding is the real content check: anything sharp cannot decode is a 400. `STORAGE_DRIVER=local` (default) writes to `UPLOADS_DIR` and `main.ts` serves `/uploads/` as immutable static files with `Cross-Origin-Resource-Policy: cross-origin` (Helmet's default would block the Vite origin); `STORAGE_DRIVER=s3` uses any S3-compatible bucket (`S3_*` vars, e.g. Cloudflare R2) and stores absolute URLs. Keys are `<folder>/<userId>-<random>.webp`; drivers only delete keys matching `SAFE_KEY`. The frontend resolves relative paths with `utils/mediaUrl`.
- **Replies & edits**: `Message.replyToId` (self-relation, `onDelete: SetNull`) and `editedAt`. `MESSAGE_INCLUDE` in `messages.repository.ts` is the single shape sent to clients (author + quoted message); reuse it for anything that returns messages. Replies must quote a message from the same room. `editMessage` is author-only and re-sanitized; the gateway broadcasts `messageEdited` and refreshes the room preview if the edited message is the latest. Messages sort by `createdAt` then `seq`.
- **Image messages**: `POST /messages/:roomId/attachments` (multipart `file` + optional `caption`, `replyToId`; members only, 10 MB) stores the image via `ImageStorageService.saveAttachment`, then pushes `newMessage` to the room through `RealtimeService` and calls `RoomsService.notifyActivity` (the same notifier the gateway uses). Message text is the caption and may be empty for photos. Deleting a message or a room deletes its files. Multipart DTOs must not declare the file as a class field: with `forbidNonWhitelisted` an undecorated own property is rejected; document it with `@ApiBody` instead.
- **Reactions**: `Reaction` rows keyed by (messageId, userId, emoji); only `ALLOWED_REACTIONS` (`messages/reactions.ts`, mirrored in the frontend `utils/reactions.ts`) pass validation. `toggleReaction` broadcasts the full raw list as `reactionsUpdated`; clients group with `groupReactions`.
- **Unread & previews**: `RoomMember.lastReadAt`; `GET /rooms/my` adds `lastMessage` and `unreadCount` (one grouped raw SQL query) and sorts by last activity. Joining a room marks it read; clients viewing a room send `markRead`. Every new message (and deletion, with `senderId: null`) emits `roomActivity` to all members' personal channels, so badges update for rooms that are not open.
- **Room lifecycle**: deleting a room emits `roomRemoved` to every former member (their client drops it and closes it if open); inviting by username emits `roomAdded` to the invitee. `GET /rooms/:roomId` returns details plus members (invite token stripped); `POST /rooms/:roomId/leave` for members, `DELETE /rooms/:roomId` for the owner (owners cannot leave, they delete). Membership and deletion writes invalidate the public-rooms cache.

**Realtime module (global):** `RealtimeService` lets any module emit to a user (`user:<id>` channel joined on connect), a room, or everyone, without importing the gateway (that would be a module cycle); the gateway attaches the server in `afterInit`. `PresenceService` counts sockets per user in memory (single instance only; multiple instances would need Redis + the Socket.IO Redis adapter). The gateway tracks the viewed room in `socket.data.roomId` so switching rooms never leaves the personal channel. On the last disconnect `User.lastSeenAt` is stored and `presence` is broadcast.

**WebSocket events (gateway → client):** `newMessage`, `messageEdited`, `reactionsUpdated`, `userTyping`, `userJoined`, `deleteMessage`, `presence` / `presenceSnapshot`, `roomActivity`, `roomAdded`, `roomRemoved`, `ERROR` (domain errors), `exception` (validation errors)
**WebSocket events (client → gateway):** `join`, `leave`, `markRead`, `sendMessage` (optional `replyToId`), `editMessage`, `toggleReaction`, `typing`, `deleteMessage`

**Global config:** `ValidationPipe` (transform + whitelist), URI-based API versioning (default v1), CORS from `FRONTEND_URL` env, global throttler (300 req/min, stricter `@Throttle` on login/register). Swagger UI is served at `/docs` unless `NODE_ENV=production`.

**Database schema:** `User` → `RoomMember` ← `Room`, `Message` belongs to `User` and `Room` (cascade delete). `Message` is indexed on `(roomId, createdAt)` for history pagination.

**Database connection:** `PrismaService` builds a `pg` pool from `DATABASE_URL` via `ConfigService`. TLS is controlled by the `sslmode` query parameter; certificate verification is not disabled in code.

### Frontend (React + Vite)

**State management:** Zustand stores (no Redux):
- `useAuthStore` — persisted to `localStorage`. Clears other stores on login/logout. The axios response interceptor calls `clearAuth` on a 401 from any non-auth route (expired token).
- `useChatStore` — runtime messages, typing users, connection status, pagination state.
- `useRoomStore` — room lists and active room, syncs with backend via `RoomsApi`.
- `useUIStore` — modal visibility and UI flags.

**WebSocket layer** (`/src/websockets/`):
- `WebSocketManager` — Singleton managing the single Socket.IO connection (`VITE_WS_URL`, falling back to `VITE_API_URL`). Use `connectWithToken` to attach the JWT; do not mutate `socket.auth` in components (React Compiler lint).
- `ChatInvoker` — Executes `ICommand` objects and maintains history for undo.
- `SendMessageCommand` / `EditMessageCommand` / `DeleteMessageCommand` — Command pattern wrapping socket emits (edit's `undo` restores the previous text).
- Images: paperclip, paste or drag & drop → `AttachmentDialog` (preview, caption, upload progress) → `messagesService.uploadAttachment`; the message itself arrives over the socket. Bubbles size photos from `attachmentWidth/Height`; `Lightbox` shows them full screen.
- `Composer` (in `features/chat/components`) owns the input: reply/edit modes with a banner, Enter sends, Shift+Enter new line, Esc cancels, ↑ in an empty field edits the last own message.
- `MessageBuilder` — Fluent builder for message payloads.
- `MessageValidationChain` — Chain of Responsibility for pre-send validation.

**`useChatFacade` hook** — the primary interface used by components. Composes `useAuthStore`, `useChatStore`, `useRoomStore`, `useChatSocket`, and `useChatHistory`. Components should use this instead of calling stores directly.

**`useSocketConnection`** (mounted in `Dashboard`) owns the connection for the whole session: connect after login, connection status, error toasts, presence into `usePresenceStore`.
**`useChatSocket`** — joins/leaves the viewed room (re-joins on reconnect) and handles its events. Read presence with `usePresence(userId, restFallback)` or `<PresenceLabel>`; zustand v5 selectors must return primitives or stable references, never fresh objects.
**`useChatHistory`** — cursor-based message pagination (loads older messages on scroll).

**Routing:** React Router v7. `App.tsx` renders `JoinForm` or `Dashboard` based on auth state.

**Profiles (frontend):** `ProfilePanel` is mounted once in `Dashboard` and driven by `useUIStore.profileUserId` (`openProfile` / `closeProfile`, not persisted). It opens from the sidebar user bar, a message author, or a room member. Own profile is editable (`EditProfileForm`, `ChangePasswordForm`); show names through `utils/displayName.nameOf`, and pass the username as the `Avatar` `seed` so the colour survives renames.

**Chat UI (Telegram-style):** `ChatHeader` shows the room avatar, name and a live subtitle (members / typing / connection); clicking it or the ⋮ menu opens `RoomInfoPanel` (members list, invite for private-room owners, leave or delete with `ConfirmDialog`). Logout and the language switcher live in the `Sidebar` user bar. Messages are grouped and given day separators by `utils/messageRows.ts`. Shared primitives: `Avatar` (deterministic gradient from `utils/avatar.ts`), `Icon` (inline SVG set), `Button` variants `primary | secondary | danger | text | icon`.

**Theming:** components are written against the dark slate scale (slate-900 page, slate-800 panels, slate-700 surfaces, slate-50…400 text). `index.css` remaps those Tailwind colour variables under `:root[data-theme='light']`, so new components get a light theme for free as long as they follow that convention: use `text-slate-50` for primary text and keep `text-white` only on coloured backgrounds (blue buttons, own bubbles, badges). `useUIStore.theme` (`system | light | dark`, persisted) is applied by `useApplyTheme` in `App`; an inline script in `index.html` applies it before first paint.

**i18n:** `react-i18next`, config in `src/config/i18n.ts`, translations in `src/locales/` keyed by real BCP 47 codes (`en`, `uk`, `pl`, `ja`) so Intl dates and plural rules (`_one/_few/_many/_other`) work; the switcher shows country-style labels (UA, JP). The chosen language is cached in localStorage.

**Dev proxy:** Vite proxies `/auth` and `/socket.io` to the backend, so the frontend uses relative URLs in development.

## Environment Variables

**Backend** (`.env`):
```
PORT=
DATABASE_URL=         # PostgreSQL (local via npm run db:start, or Neon)
JWT_SECRET=
FRONTEND_URL=         # For CORS
STORAGE_DRIVER=       # local (default) or s3
UPLOADS_DIR=          # Optional, default ./uploads (local driver)
S3_ENDPOINT= S3_REGION= S3_BUCKET= S3_ACCESS_KEY_ID= S3_SECRET_ACCESS_KEY= S3_PUBLIC_URL=  # s3 driver
```

**Frontend** (`.env`):
```
VITE_API_URL=
VITE_WS_URL=
VITE_DEMO_ACCOUNTS=   # e.g. demo,alex,maria — enables the one-click demo login
VITE_DEMO_PASSWORD=   # password of the seeded demo accounts
```

## Testing

Backend tests use Jest with NestJS testing utilities. Each module has a `.spec.ts` alongside the service. Mocks are created with `jest.fn()` — integration tests against a real DB are not currently set up.

Frontend tests use Vitest + jsdom + `@testing-library/react`.

Backend Jest config excludes modules, DTOs, guards, and strategies from coverage (configured in `package.json`).
