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

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
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

  socket.on("sendMessage", async (data) => {
    try {
      const Message = require('./models/messages');
      const Conversation = require('./models/conversation');

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

      socket.to(data.conversationId).emit("receiveMessage", message);

    } catch (err) {
      console.error("Socket sendMessage Error:", err);
    }
  });

  socket.on('disconnect', () => {
  });
});

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    startReminderJob();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
