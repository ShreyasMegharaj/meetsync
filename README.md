# MeetSync

MeetSync is a modern, real-time messaging and appointment scheduling platform. Built with a sleek, premium "liquid glass" UI using React, it features real-time chat powered by WebSockets, user profiles, dynamic cinematic backgrounds, and a built-in meeting scheduler - bridging the gap between casual messaging and professional coordination.

## Features

- **Real-Time Messaging:** Instant chat powered by Socket.io, including live online statuses, emoji support, and image sharing.
- **Appointment Scheduling:** Send, accept, reject, or cancel meeting requests directly inside your conversations.
- **Cinematic Themes:** Beautiful Light and Dark modes featuring a frosted glassmorphism interface with custom CSS logic and responsive video backgrounds.
- **Responsive Navigation:** Interactive sidebar for desktop browsers and bottom navigation for mobile clients.
- **User Discovery:** Search and discover other professionals on the platform to rapidly build your network.

## Tech Stack

### Frontend (Client)
- **Core:** React 18, Vite
- **Styling:** Tailwind CSS, Custom UI/CSS overrides
- **Animations:** Framer Motion
- **Real-time:** Socket.io-client
- **Network calls:** Axios
- **Routing:** React Router v6

### Backend (Server)
- **Environment:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose modeling)
- **WebSockets:** Socket.io
- **Security & Auth:** JSON Web Tokens (JWT), bcrypt

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Backend Server Setup

Navigate to the `server` directory and install the necessary dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Client Setup

In a new terminal window, navigate to the `client` directory and install dependencies:

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Launch the frontend development server:
```bash
npm run dev
```

The application will now be running on `http://localhost:5173`.

## Folder Structure

```
meetsync/
├── client/          # Frontend application (React + Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI widgets
│   │   ├── context/     # Auth and Theme Providers
│   │   ├── pages/       # Dashboard, Chat, Profile screens
│   │   └── utils/       # API interceptors & Socket configs
│   ├── index.html
│   └── package.json
└── server/          # Backend API (Express)
    ├── middleware/  # JWT Auth protection
    ├── models/      # Mongoose Schemas (User, Message, Appointment, Conversation)
    ├── routes/      # Application API endpoints
    ├── index.js     # Entry point & Socket.io initialization
    └── package.json
```
