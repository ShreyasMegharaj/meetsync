# ⚡ MeetSync

**🚀 Live Demo: [https://meetsync-sand.vercel.app](https://meetsync-sand.vercel.app)**

> *Built to explore full-stack real-time systems combining chat and scheduling in one platform.*

MeetSync is a modern, real-time messaging and appointment scheduling platform. Built with a sleek, premium "liquid glass" UI using React, it features real-time chat powered by WebSockets, user profiles, dynamic cinematic backgrounds, and a built-in meeting scheduler—bridging the gap between casual messaging and professional coordination.

---

## ✨ Features

- **Real-Time Messaging:** Instant chat powered by Socket.io, including live online statuses and image sharing.
- **Appointment Scheduling:** Send, accept, reject, or cancel meeting requests directly inside your conversations.
- **Cinematic Themes:** Beautiful Light and Dark modes featuring a frosted glassmorphism interface with custom CSS logic and responsive backgrounds.
- **Responsive Navigation:** Interactive sidebar for desktop browsers and bottom navigation for mobile clients.
- **User Discovery:** Search and discover other professionals on the platform to rapidly build your network.

## 🛠 Tech Stack

### Frontend (Client)
- **Core:** React 18, Vite
- **Styling:** Tailwind CSS, Custom UI/CSS overrides
- **Animations:** Framer Motion
- **Real-time:** Socket.io-client
- **Routing:** React Router v6

### Backend (Server)
- **Environment:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose modeling)
- **WebSockets:** Socket.io
- **Security & Auth:** JSON Web Tokens (JWT), bcrypt

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Environment Variables

Create a `.env` file in the **`server`** directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173

# Email reminders (Brevo)
EMAIL_USER=your_verified_sender_email@gmail.com
BREVO_API_KEY=your_brevo_api_key
```

Create a `.env` file in the **`client`** directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Backend Server Setup

Navigate into the server folder:
```bash
cd server
npm install
npm run dev
```

### 3. Frontend Client Setup

Open a new terminal window:
```bash
cd client
npm install
npm run dev
```

The application will now be running on `http://localhost:5173`.

---

## 🌍 Deployment

MeetSync is designed to be easily deployed using modern PaaS providers:

### Frontend (Vercel)
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Set the Framework Preset to **Vite**.
4. Set the Root Directory to `client`.
5. Add the Environment Variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`
6. Deploy!

### Backend (Render / Heroku)
1. Create a new Web Service on Render.
2. Set the Root Directory to `server`.
3. Set the Build Command: `npm install`
4. Set the Start Command: `node index.js` (or `npm start` if defined).
5. Add all Server Environment Variables (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `BREVO_API_KEY`, etc.) in the Render dashboard.

---

## 📁 Folder Structure

```
meetsync/
├── client/          # Frontend application (React + Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI widgets
│   │   ├── context/     # Auth and Theme Providers
│   │   ├── pages/       # Dashboard, Chat, Profile screens
│   │   └── utils/       # API interceptors & Socket configs
└── server/          # Backend API (Express)
    ├── middleware/  # JWT Auth protection
    ├── models/      # Mongoose Schemas
    ├── routes/      # Application API endpoints
    └── index.js     # Entry point & Socket.io initialization
```
