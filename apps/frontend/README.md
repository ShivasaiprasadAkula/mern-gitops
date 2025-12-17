# Frontend - Chat App
Use Vite: copy .env.example, npm install, npm run dev

## Setup

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. Create a `.env` file or set environment variables (optional):

- VITE_API_URL (defaults to http://localhost:5000/api)
- VITE_SOCKET_URL (defaults to http://localhost:5000)

3. Run in development:

```powershell
npm run dev
```

## Features
- Login/Register (JWT)
- Search users, start 1-to-1 chat
- Create group chat, add/remove members (group admin only)
- Send and receive real-time messages (Socket.IO)
- Message notifications, typing indicator, auto-scroll

