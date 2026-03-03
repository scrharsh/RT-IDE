# Real-Time Code Collaboration IDE

A full-stack multiplayer coding environment with AI-assisted completions, versioning, and interview-style problem sharing.

## Tech Stack
- **Frontend:** React + Vite + Monaco Editor + Socket.io Client
- **Backend:** Node.js + Express + Socket.io + MongoDB + Redis
- **AI:** Hugging Face Inference API (StarCoder)

## Features
- Real-time code syncing for multi-user rooms with lightweight client-side debounce
- Presence tracking for active participants with configurable room capacity
- Session persistence in MongoDB with Redis hot-cache reads
- Version history snapshots and restore flow
- LeetCode-style problem statement sharing and in-room preview
- Redis-backed operation counters and code cache
- AI code completion endpoint powered by Hugging Face
- Connection status and server-error surfacing in the client

## Project Structure

```txt
RT-IDE/
  client/      # React app + Monaco editor
  server/      # Express API + Socket.io + DB integrations
```

## Local Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Start infrastructure (Mongo + Redis)
Run your preferred local instances, then configure:

```bash
cp server/.env.example server/.env
```

### 3) Start app
```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:4000

## API Quick Reference
- `GET /api/sessions/:roomId` → load/create room session
- `POST /api/sessions/:roomId/version` → append session snapshot
- `POST /api/sessions/:roomId/problem` → set shared coding problem
- `POST /api/sessions/:roomId/ai-complete` → get AI completion

## Socket Events
- `join_room` `{ roomId, username }` (with ack response)
- `code_change` `{ roomId, code, language }`
- `code_update` `{ code, language }`
- `presence` `string[]`
- `server_error` `{ message }`

## Environment
`server/.env.example`
- `PORT` server port
- `CLIENT_URL` allowed frontend origin for Socket.io
- `MONGO_URI` MongoDB connection string
- `REDIS_URL` Redis connection string
- `HF_TOKEN` Hugging Face token for AI completion
- `MAX_ROOM_USERS` soft limit for concurrent users per room (default: 10)


## Troubleshooting
- **`WebSocket is closed before the connection is established`**:
  - Ensure the backend is running on `http://localhost:4000`.
  - Ensure `CLIENT_URL` in `server/.env` matches your frontend origin (`http://localhost:5173` or `http://127.0.0.1:5173`).
  - If your network/proxy blocks pure websocket startup, the client now allows polling fallback automatically.

## Example Multi-user URL
Open these in different browsers:
- `http://localhost:5173/?room=interview-42&user=alice`
- `http://localhost:5173/?room=interview-42&user=bob`

