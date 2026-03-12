## <p align="center">
##  A real-time chat frontend built with React, Vite, and Zustand.
</p>


## Description

This is the frontend repository for a Full-stack Real-time Chat application. It handles user interface rendering, JWT-based authentication state, and real-time bidirectional communication using the Socket.IO client. The application is built with a strong focus on Clean Architecture and strictly follows the Flux pattern for state management.

## Tech Stack
* **Framework:** React (Vite)
* **State Management:** Zustand (Flux Architecture)
* **Real-time:** Socket.IO Client
* **Styling:** Tailwind CSS
* **API Client:** Axios

## Project Setup

1. Install dependencies:
```bash
npm install
```
2. Configure environment variables (optional):
```bash
cp .env.example .env
# Open .env and add your backend API URL (e.g., VITE_API_URL=http://localhost:3000)
```

## Project Setup
```bash
# development mode (with hot-module replacement)
npm run dev

# build for production
npm run build

# preview production build
npm run preview
```

## Application Reference

### State Management (Zustand Stores)

| Store | Purpose | Key State Variables |
| :--- | :--- | :--- |
| `useAuthStore` | Manages user authentication and JWT token persistence | `user`, `token` |
| `useChatStore` | Manages chat history, typing indicators, and connection status | `messages`, `typingUsers`, `isConnected`, `isReconnecting` |

### WebSocket Events (Socket.IO Client)

* **Connection:** Automatically connects with the JWT token in the auth payload upon successful login.
* **`join` (Emit):** Sent to subscribe the user to a specific chat room after authentication.
  * Payload: `{ "room": "general", "username": "Andrew" }`
* **`SendMessage` (Emit):** Sent when the user submits a new message in the chat room.
  * Payload: `{ "room": "general", "message": "Hello world!" }`
* **`typing` (Emit):** Sent to notify others in the room when the user starts or stops typing.
  * Payload: `{ "room": "general", "isTyping": true }`
* **`newMessage` (Listen):** Received from the server to update the local chat history in real-time.
* **`userTyping` (Listen):** Received from the server to show or hide the "User is typing..." indicator.