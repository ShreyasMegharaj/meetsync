import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Ensure we connect to the root of the server, not the `/api` subpath.
// E.g., if VITE_API_URL is "http://localhost:5000/api", we slice off the "/api".
const socketUrl = API_BASE.endsWith("/api") 
    ? API_BASE.slice(0, -4) 
    : API_BASE;

const socket = io(socketUrl, {
  withCredentials: true,
  transports: ["websocket"]
});

export default socket;