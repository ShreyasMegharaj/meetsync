const express = require('express');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Conversation = require('../models/conversation');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get connection status between current user and target user
router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.json({ status: 'self' });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, targetUserId] }
    });

    if (conversation) {
      return res.json({ status: 'connected', conversationId: conversation._id });
    }

    const request = await Request.findOne({
      $or: [
        { from_user: currentUserId, to_user: targetUserId, status: 'pending' },
        { from_user: targetUserId, to_user: currentUserId, status: 'pending' }
      ]
    });

    if (request) {
      if (request.from_user.toString() === currentUserId) {
        return res.json({ status: 'pending_sent', requestId: request._id });
      } else {
        return res.json({ status: 'pending_received', requestId: request._id });
      }
    }

    res.json({ status: 'none' });
  } catch (error) {
    console.error("Get request status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get incoming pending requests for current user
router.get('/incoming', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({
      to_user: req.user.id,
      status: 'pending'
    })
    .populate('from_user', 'name username profile_picture')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Get incoming requests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a friend request
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { to_user } = req.body;
    const currentUserId = req.user.id;

    if (to_user === currentUserId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const existingConversation = await Conversation.findOne({
      participants: { $all: [currentUserId, to_user] }
    });
    if (existingConversation) {
      return res.status(400).json({ message: "Already connected" });
    }

    const existingRequest = await Request.findOne({
      $or: [
        { from_user: currentUserId, to_user: to_user, status: 'pending' },
        { from_user: to_user, to_user: currentUserId, status: 'pending' },
        { from_user: currentUserId, to_user: to_user, status: 'accepted' },
        { from_user: to_user, to_user: currentUserId, status: 'accepted' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already exists or accepted" });
    }

    const newRequest = await Request.create({
      from_user: currentUserId,
      to_user: to_user,
      status: 'pending'
    });

    await newRequest.populate('from_user', 'name username profile_picture');

    const io = req.app.get('io');
    if (io) {
      // Emit to a specific user's room if they joined one, else broadcast
      io.to(to_user).emit('new_request', newRequest);
    }

    res.status(201).json(newRequest);
  } catch (error) {
     if (error.code === 11000) {
       return res.status(400).json({ message: "Request already exists." });
     }
    console.error("Send request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept a friend request
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const currentUserId = req.user.id;

    const request = await Request.findOne({ _id: requestId, to_user: currentUserId, status: 'pending' });
    
    if (!request) {
      return res.status(404).json({ message: "Request not found or not pending" });
    }

    request.status = 'accepted';
    await request.save();

    const newConversation = await Conversation.create({
      participants: [request.from_user, request.to_user]
    });

    await request.populate('from_user to_user', 'name username profile_picture');

    const io = req.app.get('io');
    if (io) {
      io.to(request.from_user._id.toString()).emit('request_accepted', { request, conversation: newConversation });
    }

    res.json({ message: "Request accepted", conversationId: newConversation._id });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reject a friend request
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const currentUserId = req.user.id;

    const request = await Request.findOne({ _id: requestId, to_user: currentUserId, status: 'pending' });
    
    if (!request) {
      return res.status(404).json({ message: "Request not found or not pending" });
    }

    request.status = 'rejected';
    await request.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(request.from_user.toString()).emit('request_rejected', { requestId });
    }

    res.json({ message: "Request rejected" });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
