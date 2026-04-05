const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/messages');
const Conversation = require('../models/conversation');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/*
GET /api/messages/:conversationId
Fetch all messages for a conversation
*/
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ conversation_id: conversationId })
      .populate('sender_id', 'name username profile_picture')
      .populate({
        path: 'appointment_id',
        populate: [
          { path: 'host_id', select: 'name username profile_picture' },
          { path: 'client_id', select: 'name username profile_picture' }
        ]
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/*
POST /api/messages
Send a message
*/
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { conversation_id, message_text, message_type, image_url } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    const type = message_type || 'text';

    // Validate based on type
    if (type === 'text') {
      if (!message_text || !message_text.trim()) {
        return res.status(400).json({ message: 'Message text is required for text messages' });
      }
      if (message_text.trim().length > 1000) {
        return res.status(400).json({ message: 'Message cannot exceed 1000 characters' });
      }
    } else if (type === 'image') {
      if (!image_url) {
        return res.status(400).json({ message: 'Image data is required for image messages' });
      }
      // ~2MB base64 limit
      if (image_url.length > 2800000) {
        return res.status(400).json({ message: 'Image is too large. Max ~2MB.' });
      }
    }

    const conversation = await Conversation.findById(conversation_id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messageData = {
      conversation_id,
      sender_id: req.user.id,
      message_type: type,
    };

    if (type === 'text') {
      messageData.message_text = message_text.trim();
    } else if (type === 'image') {
      messageData.image_url = image_url;
      messageData.message_text = message_text?.trim() || '📷 Image';
    }

    const message = await Message.create(messageData);

    conversation.last_message_at = new Date();
    await conversation.save();

    await message.populate(
      'sender_id',
      'name username profile_picture'
    );

    const io = req.app.get('io');
    if (io) {
      io.to(conversation_id.toString()).emit('receiveMessage', message);
    }

    res.status(201).json(message);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;