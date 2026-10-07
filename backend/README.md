

## <p align="center">
##  A real-time chat backend built with NestJS, WebSockets, and Prisma.
</p>


## Description

This is the backend repository for a Full-stack Real-time Chat application. It handles user authentication via JWT, persistent message storage using Prisma ORM with a Neon PostgreSQL database, and real-time bidirectional communication using Socket.IO.

## Tech Stack
* **Framework:** NestJS (Node.js)
* **Database:** PostgreSQL (Neon)
* **ORM:** Prisma
* **Real-time:** Socket.IO
* **Security:** Passport JWT & Class Validator

## Project Setup

1. Install dependencies:
```bash
npm install
```
2. Configure environment variables:
```bash
cp .env.example .env
# Open .env and add your DATABASE_URL, PORT, and JWT_SECRET
```
3. Initialize the database:
```bash
npx prisma db push
npx prisma generate
```

## Running the Application

```bash
# watch mode (recommended for development)
npm run start:dev

# production mode
npm run start:prod
```


## API Reference

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Authenticate user & get JWT token | No |
| `GET` | `/auth/me` | Get current authenticated user details | Yes (JWT) |
| `GET` | `/messages/:room` | Get message history for a specific room | Yes (JWT) |

### WebSocket Events (Socket.IO)

* **Connection:** Requires a JWT token in the handshake `auth` payload; verified in `ChatGateway.handleConnection`.
* **`join` (Emit):** Subscribes the client to a specific chat room.
  * Payload: `{ "room": "general" }`
* **`sendMessage` (Emit):** Sends a message to a room and saves it to the database.
  * Payload: `{ "room": "general", "message": "Hello world!" }`
* **`newMessage` (Listen):** Broadcasted by the server when a new message is posted in the room.
  * Payload: Message object including sender details.