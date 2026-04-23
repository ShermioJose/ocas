# OCAS Real-Time Socket Server

This is the standalone **Node.js + Socket.io** chat server for the OCAS Marketplace application. It bridges the gap between your real-time React frontend and the secure REST backend (Laravel 11).

## Tech Stack
- Node.js
- Express
- Socket.io (Realtime Events)
- JSONWebToken (JWT Authorization parsing)
- Axios (Secure proxy bypass to Laravel)

---

## 🚀 Setup & Execution

### 1. Variables (`.env`)
You must define the following variables in a `.env` file at the root of this `socket-server` directory. A starter file has already been injected for you mapping local standards.

```env
PORT=3001
LARAVEL_API_URL=http://localhost:8000/api
JWT_SECRET=YOUR_LARAVEL_JWT_SECRET_HERE
SOCKET_SECRET=YOUR_SHARED_LARAVEL_SOCKET_SECRET_HERE
```
> **Critical:** The `JWT_SECRET` natively mirrors exactly what was generated via `php artisan jwt:secret` on the Laravel end. `SOCKET_SECRET` must also randomly pair identically across both platforms to secure backend-originated writes safely securely avoiding exploitation.

### 2. Dependency Installation
Navigate into the directory and hydrate via NPM:
```bash
cd socket-server
npm install
```

### 3. Spin Up Server
To initialize natively:
```bash
npm start
```
For dynamic automatic restarts during development, run:
```bash
npm run dev
```

---

## 📡 Exposed HTTP Endpoints

- **`GET /health`** - System check returning connection aggregates mapping node stability.
- **`GET /online-users`** - Secure internal-only ping. Used natively by Laravel systems securely pushing `X-Socket-Secret` to securely extract array mappings bounding current connected clients securely.

---

## 🔒 Security Policies
Every incoming connection natively traverses Express logic utilizing native `jwt.verify()` middleware directly mapping the `socket.handshake.auth.token`. Users dropping invalid permutations natively trigger immediate socket disconnections securely avoiding unauthenticated crosstalk securely natively trapping exploits safely.
