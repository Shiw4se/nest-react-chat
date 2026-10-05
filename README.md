# Real-Time Chat (NestJS + React)

A full-stack chat application with public and private rooms, live messaging over WebSockets, JWT authentication and persistent history in PostgreSQL.

I built it end to end: the NestJS backend, the React frontend, the tests and the CI/CD pipeline.

## Features

- **Rooms**: public rooms anyone can join, and private rooms entered through an invite link or a direct invite. Room owners can regenerate the invite token.
- **Live messaging**: messages, typing indicators and join notifications delivered over Socket.IO.
- **Message history**: cursor-based pagination that loads older messages as you scroll up.
- **Message deletion** by the author, propagated to everyone in the room.
- **Authentication**: registration and login with JWT; the same token protects both the REST API and the WebSocket connection.
- **Four interface languages**: English, Ukrainian, Polish and Japanese.
- **Onboarding tour** for first-time users, plus keyboard-accessible modals.

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | NestJS 11, Socket.IO, Prisma 7, PostgreSQL, Passport JWT |
| Frontend | React 19, Vite, TypeScript, Zustand, Tailwind CSS, React Router 7, react-i18next |
| Testing | Jest and Supertest (backend), Vitest and React Testing Library (frontend) |
| Delivery | GitHub Actions, AWS EC2, pm2 |

## Architecture

### Backend

Modules: `auth`, `rooms`, `messages`, `chat` (the WebSocket gateway) and `prisma`.

- REST requests go Controller → Service → Repository → Prisma.
- `ChatGateway` handles every real-time event and reuses the same services as the REST API, so the business rules live in one place.
- Repositories are injected by token. `CachedRoomsRepository` wraps the real one and caches the public room list for 30 seconds, without the service knowing about it.
- `JwtAuthGuard` protects REST routes, `WsJwtGuard` protects socket connections, and `RoomAccessGuard` checks room membership.

Data model: `User`, `Room` (public or private, with an invite token), `RoomMember` and `Message`. Deleting a room or user cascades to memberships and messages.

### Frontend

- **State** lives in four Zustand stores: auth, chat, rooms and UI.
- **WebSocket layer**: a single `WebSocketManager` owns the connection. Sending and deleting messages are command objects run through `ChatInvoker`; a validation chain checks a message before it is sent.
- **`useChatFacade`** is the one hook components talk to. It combines the stores, the socket subscription and history loading, so components stay free of transport details.

### Security

- Passwords hashed with bcrypt.
- Message text sanitized on the server before it is stored (all HTML stripped).
- Request validation with a whitelist: unknown fields are rejected.
- Rate limiting on every route, stricter on login and registration (5 requests per minute).
- Helmet security headers and CORS restricted to the configured frontend origin.

## API

REST (prefix `/v1`):

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, receive a JWT |
| GET | `/auth/me` | Current user |
| POST | `/rooms` | Create a room |
| GET | `/rooms/my` | Rooms the user belongs to |
| GET | `/rooms/public` | Public rooms |
| POST | `/rooms/join/:token` | Join a private room by invite token |
| GET | `/rooms/:roomId/invite-token` | Get the room's invite token |
| PATCH | `/rooms/:roomId/invite-token` | Regenerate the invite token |
| POST | `/rooms/:roomId/invite-user` | Invite a user directly |
| GET | `/messages/:roomId` | Paginated message history |

WebSocket events:

| Client → server | Server → client |
|---|---|
| `join` | `userJoined` |
| `sendMessage` | `newMessage` |
| `typing` | `userTyping` |
| `deleteMessage` | |

## Running locally

Requirements: Node.js 20+ and a PostgreSQL database (a free Neon instance works).

### Backend

```bash
cd backend
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run start:dev
```

The API starts on the port set in `PORT` (3000 in the example file).

### Frontend

```bash
cd frontend
cp .env.example .env      # point VITE_API_URL and VITE_WS_URL at the backend
npm install
npm run dev
```

For local development set `VITE_API_URL=http://localhost:3000` and `VITE_WS_URL=ws://localhost:3000`. The Vite dev server proxies `/auth` and `/socket.io` to those addresses.

Open http://localhost:5173.

## Tests

```bash
cd backend && npm test          # Jest unit tests
cd backend && npm run test:e2e  # end-to-end tests
cd frontend && npm test         # Vitest + React Testing Library
```

Backend services, controllers and the gateway each have a spec file; the frontend covers the chat store and UI components.

## CI/CD

- **Tests**: GitHub Actions runs the backend and frontend test suites on every push to `main` and on every pull request.
- **Deploy**: after tests pass on `main`, the pipeline connects to an AWS EC2 server over SSH, pulls the code, builds both apps and restarts the backend under pm2.
- **Automated PR review**: a workflow runs Claude Code on each pull request and posts review comments.
