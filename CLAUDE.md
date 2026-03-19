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
```

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

### CI

GitHub Actions runs on push to `main` and PRs. Steps: install, `prisma generate`, then `npm test` for both backend and frontend.

## Architecture

### Backend (NestJS)

**Module structure:** `AppModule` imports `AuthModule`, `ChatModule`, `MessagesModule`, `RoomsModule`, `PrismaModule`.

**Data flow for REST:** Controller → Service → Repository → PrismaService

**Data flow for WebSocket:** `ChatGateway` handles all real-time events. It depends on `RoomsService`, `MessagesService`, and validates connections via `WsJwtGuard`.

**Key patterns:**
- **Repository pattern**: `RoomsRepository`, `MessagesRepository`, `UserRepository` abstract Prisma queries. Injected by token (`ROOMS_REPOSITORY`) so they can be swapped.
- **Cached repository**: `CachedRoomsRepository` wraps `RoomsRepository` with in-memory cache (30s TTL for public rooms). Provided as `ROOMS_REPOSITORY` token in `RoomsModule`.
- **Guards**: `JwtAuthGuard` (REST), `WsJwtGuard` (WebSocket). JWT tokens for WebSocket come from socket handshake headers or `auth` payload.

**WebSocket events (gateway → client):** `newMessage`, `userTyping`, `userJoined`, `ERROR`
**WebSocket events (client → gateway):** `join`, `SendMessage`, `typing`, `deleteMessage`

**Global config:** `ValidationPipe` (transform + whitelist), URI-based API versioning (default v1), CORS from `FRONTEND_URL` env.

**Database schema:** `User` → `RoomMember` ← `Room`, `Message` belongs to `User` and `Room` (cascade delete).

### Frontend (React + Vite)

**State management:** Zustand stores (no Redux):
- `useAuthStore` — persisted to `localStorage`. Clears other stores on login/logout.
- `useChatStore` — runtime messages, typing users, connection status, pagination state.
- `useRoomStore` — room lists and active room, syncs with backend via `RoomsApi`.
- `useUIStore` — modal visibility and UI flags.

**WebSocket layer** (`/src/websockets/`):
- `WebSocketManager` — Singleton managing the single Socket.IO connection.
- `ChatInvoker` — Executes `ICommand` objects and maintains history for undo.
- `SendMessageCommand` / `DeleteMessageCommand` — Command pattern wrapping socket emits.
- `MessageBuilder` — Fluent builder for message payloads.
- `MessageValidationChain` — Chain of Responsibility for pre-send validation.

**`useChatFacade` hook** — the primary interface used by components. Composes `useAuthStore`, `useChatStore`, `useRoomStore`, `useChatSocket`, and `useChatHistory`. Components should use this instead of calling stores directly.

**`useChatSocket`** — subscribes to socket events and dispatches to `useChatStore`.
**`useChatHistory`** — cursor-based message pagination (loads older messages on scroll).

**Routing:** React Router v7. `App.tsx` renders `JoinForm` or `Dashboard` based on auth state.

**i18n:** `react-i18next` with translations in `/src/i18n/`.

**Dev proxy:** Vite proxies `/auth` and `/socket.io` to the backend, so the frontend uses relative URLs in development.

## Environment Variables

**Backend** (`.env`):
```
PORT=
DATABASE_URL=         # PostgreSQL (Neon recommended)
JWT_SECRET=
FRONTEND_URL=         # For CORS
```

**Frontend** (`.env`):
```
VITE_API_URL=
VITE_WS_URL=
```

## Testing

Backend tests use Jest with NestJS testing utilities. Each module has a `.spec.ts` alongside the service. Mocks are created with `jest.fn()` — integration tests against a real DB are not currently set up.

Frontend tests use Vitest + jsdom + `@testing-library/react`.

Backend Jest config excludes modules, DTOs, guards, and strategies from coverage (configured in `package.json`).
