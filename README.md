# OCAS - Online Classified Ads System

OCAS is a full-stack, real-time classified marketplace platform that allows users to register, post advertisements, upload images, manage wishlists, and communicate with other users seamlessly via real-time messaging.

This repository serves as the complete technical documentation detailing the architecture, local development environment, and production deployment pipeline.

---

## 🏗 Architecture & Tech Stack

OCAS utilizes a decoupled micro-service architecture to separate the presentation layer, the heavy-lifting API, and the real-time event pipeline.

* **Frontend:** React.js + Vite (Deployed on Netlify)
* **Backend API:** Laravel 11.x (Deployed on Render)
* **Real-time Messaging:** Node.js + Socket.io (Running parallel to Laravel on Render)
* **Database:** MySQL 8.0 (Deployed on Railway)
* **Storage:** Cloudinary (For CDN image delivery)
* **Web Server:** Nginx (Proxying both Laravel PHP-FPM and the Node.js Socket process)

### How the Services Connect:
1. The **React Frontend** communicates statelessly with the **Laravel API** via RESTful HTTP endpoints authenticated by JWTs (JSON Web Tokens).
2. For messaging, the Frontend establishes a persistent `Upgrade: websocket` connection to the **Node.js Socket Server** on `/socket.io/`.
3. The Node server validates incoming socket requests by locally decoding the JWT signed by the Laravel API.
4. The Laravel backend handles all persistence, directly injecting into the **Railway MySQL Database** and uploading raw files directly to the **Cloudinary** CDN bucket.

---

## 💻 Local Development Setup

The easiest way to run the entire backend stack locally is via the provided Docker Compose configuration.

### Prerequisites
* Docker & Docker Compose
* Node.js & npm (for frontend)
* PHP Composer (optional, for local vendor installations)

### 1. Spin up the Backend (API, Socket, DB, Web Server)
Navigate to the root directory and start the Docker containers:
```bash
docker-compose up -d --build
```
This will automatically spin up 4 isolated containers:
- `ocas-php-fpm-1` (Laravel Backend)
- `ocas-nginx-1` (Web Server mapping port 8000)
- `ocas-db-1` (Local MySQL instance mapping port 3306)
- `ocas-node-1` (Socket Server mapping port 3000)

Run database migrations natively through the container:
```bash
docker-compose exec app php artisan migrate --seed
```

### 2. Spin up the Frontend
In a separate terminal, navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

For the application to function correctly, the following `.env` files must be populated.

### Backend (`backend/.env`)
```env
APP_NAME=OCAS
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY
APP_DEBUG=false
APP_URL=https://your-render-url.onrender.com
FRONTEND_URL=https://your-netlify-url.netlify.app

# Railway MySQL Connection
DB_CONNECTION=mysql
DB_HOST=viaduct.proxy.rlwy.net
DB_PORT=xxxxx
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=xxxxx

# JWT Authentication
JWT_SECRET=YOUR_JWT_SECRET

# Cloudinary Integration
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# SMTP Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=admin@ocas.com
MAIL_PASSWORD=xxxxx
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://your-render-url.onrender.com/api
VITE_SOCKET_URL=https://your-render-url.onrender.com
```

---

## 🚀 Production Deployment Guide

OCAS is configured for a robust multi-cloud deployment pipeline.

### Step 1: Database (Railway)
1. Create a new MySQL instance on Railway.
2. Note the generated TCP Host, Port, Username, and Password. These will form your backend database credentials.

### Step 2: Backend API & Sockets (Render)
1. Create a new **Web Service** on Render connected to this repository.
2. Select **Docker** as the runtime environment.
3. Set the Root Directory to `backend/`.
4. Render will automatically build from `backend/Dockerfile`. This custom Dockerfile:
   - Installs PHP-FPM, Node.js, and Nginx natively.
   - Copies the Laravel API and Socket source code.
   - Triggers `backend/.docker/start.sh` upon initialization.
5. `start.sh` is a critical initialization script that securely updates container file permissions (`chmod 775 storage`), runs `php artisan migrate --force`, and boots up `supervisord` to manage the concurrent Nginx, PHP, and Node background processes.

### Step 3: Frontend UI (Netlify)
1. Create a new site on Netlify importing this repository.
2. Set the Base directory to `frontend/`.
3. Build command: `npm run build`.
4. Publish directory: `dist/`.
5. Ensure `VITE_API_URL` and `VITE_SOCKET_URL` are injected as Netlify environment variables targeting the active Render backend URL.

---

## 🔧 Key Engineering Decisions & Fixes

During the development cycle, several critical architectural decisions were made to ensure production stability:

1. **Stateful CORS Configuration:**
   Render environments inherently possess strict reverse-proxy rules. The `cors.php` configuration was explicitly hardened to accept `supports_credentials => true` alongside explicit allowed origins (`FRONTEND_URL`) to allow seamless JWT passing without failing Preflight `OPTIONS` requests.
2. **Socket.io Nginx Proxying:**
   Instead of exposing the Node.js socket server on a separate port (which is heavily blocked by cloud firewalls), Nginx was configured via `backend/.docker/nginx.conf` to internally proxy any requests hitting `/socket.io/` directly to the `127.0.0.1:3001` Node process, passing standard HTTP/1.1 Upgrade headers.
3. **Stateless JWT Migration:**
   Laravel Sanctum relies on stateful cookies, which inherently break on isolated sub-domains and strict CORS pipelines. The authentication system was completely rewritten using `tymon/jwt-auth` to utilize explicit `Bearer` tokens in request headers, allowing the Node server to independently cryptographically verify tokens.
4. **Mobile Responsiveness (`100dvh`):**
   Fixed critical mobile bugs where virtual keyboards and bottom navigation bars pushed chat interfaces out of frame. `Messages.module.css` explicitly utilizes `height: 100dvh;` combined with `position: fixed; bottom: 60px; z-index: 99;` to solidly lock UI inputs natively into the viewport.
5. **Nginx Payload Ceiling Limits:**
   Render limits incoming container traffic buffers natively. To process high-res Cloudinary image uploads, `backend/.docker/nginx.conf` was manually patched to include `client_max_body_size 6M;`, operating parallel with React client-side 5MB payload rejection constraints.

---

## ⚠️ Known Limitations

* **Render Free-Tier Sleep:** Because the backend API runs on a free-tier Render instance, it sleeps after 15 minutes of inactivity. When the system wakes up, the first API request (and subsequent socket connection) may experience a 30-50 second cold-boot delay.
* **Ephemeral File Storage:** Render containers use ephemeral filesystems. Any files stored locally in `/storage/app` are permanently destroyed on every deployment. This is why **Cloudinary** was explicitly utilized as an immutable cloud bucket for all user-generated content.
* **Notification Emails:** Email systems rely on an external SMTP provider. If the environment variables are invalid, API endpoints natively wrap email dispatches in strict `try/catch` loops to prevent fatal UI crashes.
