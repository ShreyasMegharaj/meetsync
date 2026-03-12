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

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────
// Socket.io
// ─────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible inside any route via req.app.get('io')
app.set('io', io);
   
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log("Joined room:", conversationId);
  });
  
  // WhatsApp-style instant socket send
  socket.on("sendMessage", async (data) => {
    try {
      const Message = require('./models/messages');
      const Conversation = require('./models/Conversation');
      
      const message = await Message.create({
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        message_text: data.text,
        message_type: "text"
      });
      
      await Conversation.findByIdAndUpdate(data.conversationId, {
        last_message_at: new Date()
      });
      
      await message.populate('sender_id', 'name username profile_picture');
      
      // Emit to whole room
      console.log("Message broadcast to room", data.conversationId, ":", data.text);
      io.to(data.conversationId).emit("receiveMessage", message);
      
    } catch (err) {
      console.error("Socket sendMessage Error:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// ─────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────
 
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─────────────────────────────────────────
// Routes
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);

// ─────────────────────────────────────────
// Test Route
// ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Meetsync API is running');
});

// ─────────────────────────────────────────
// 404 Handler — must be after all routes
// ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─────────────────────────────────────────
// Connect MongoDB then Start Server
// ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    startReminderJob();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });