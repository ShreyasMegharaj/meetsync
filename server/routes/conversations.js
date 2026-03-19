// routes/conversations.js

const express = require('express');
const Conversation = require('../models/conversation');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;

    // 1️⃣ Username must be provided
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // 2️⃣ Find the target user
    const targetUser = await User.findOne({ username: username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3️⃣ Cannot chat with yourself
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself' });
    }

    // 4️⃣ Check if conversation already exists between these 2 users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, targetUser._id] }
    });

    // 5️⃣ If exists — return it, if not — create it
    if (conversation) {
      return res.status(200).json(conversation); // 200 = already existed
    }

    conversation = await Conversation.create({
      participants: [req.user.id, targetUser._id],
      last_message_at: new Date(),
    });

    return res.status(201).json(conversation); 

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name username profile_picture')
      .sort({ last_message_at: -1 }); 

    const formatted = conversations.map(convo => {
      const otherUser = convo.participants.find(
        p => p._id.toString() !== req.user.id
      );
      return {
        _id: convo._id,
        otherUser,
        last_message_at: convo.last_message_at,
        createdAt: convo.createdAt,
      };
    });

    res.status(200).json(formatted);

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name username profile_picture');

    // 1️⃣ Conversation must exist
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // 2️⃣ Security — user must be a participant
    // Without this anyone with any valid token can read any conversation
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json(conversation);

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;