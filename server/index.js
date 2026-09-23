const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const startReminderJob = require('./scheduler/reminder');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const appointmentRoutes = require('./routes/appointments');
const requestRoutes = require('./routes/requests');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://meetsync-sand.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or matching allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);

io.on('connection', (socket) => {

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('authenticate', (userId) => {
    if (userId) {
      socket.join(userId);
    }
  });

  socket.on('disconnect', () => {
  });
});

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => {
  res.send('Meetsync API is running');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

if (!process.env.MONGO_URI) {
  console.error('❌ FATAL: MONGO_URI is missing from environment variables!');
  console.error('Please configure MONGO_URI in your Render Dashboard -> Environment Variables.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    startReminderJob();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    if (err.message && err.message.includes('ENOTFOUND')) {
      console.error('👉 Cause: MongoDB Atlas cluster host not found. Your MongoDB Atlas free cluster was likely PAUSED due to inactivity. Log in to cloud.mongodb.com and click Resume Cluster.');
    }
    process.exit(1);
  });
