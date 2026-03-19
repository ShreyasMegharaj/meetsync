const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Conversation = require('../models/conversation');
const Message = require('../models/messages');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --------------------------------------------------
// GET /api/appointments
// Fetch all appointments for the logged-in user
// --------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [
        { host_id: req.user.id },
        { client_id: req.user.id }
      ]
    })
    .populate('host_id', 'name username profile_picture')
    .populate('client_id', 'name username profile_picture')
    .populate('conversation_id')
    .sort({ scheduled_for: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------------------------------------
// POST /api/appointments
// Create appointment offer inside a conversation
// --------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, time, note } = req.body;
    const conversation_id = req.body.conversation_id || req.body.conversationId;

    if (!conversation_id || !date || !time) {
      return res.status(400).json({ message: 'Conversation ID, date and time are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
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

    // Convert date + time to proper Date object
    const scheduledDate = new Date(`${date}T${time}`);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date or time format' });
    }

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ message: 'Appointment must be in the future' });
    }

    const clientId = conversation.participants.find(
      p => p.toString() !== req.user.id
    );

    const appointment = await Appointment.create({
      conversation_id,
      host_id: req.user.id,
      client_id: clientId,
      scheduled_for: scheduledDate,
      note: note ? note.trim() : '',
      status: 'pending',
      reminder_sent: false
    });

    // Create appointment message inside chat
    await Message.create({
      conversation_id,
      sender_id: req.user.id,
      message_type: 'appointment',
      appointment_id: appointment._id,
      message_text: ''
    });

    // Update conversation activity
    await Conversation.findByIdAndUpdate(conversation_id, {
      last_message_at: new Date()
    });

    const populatedApt = await Appointment.findById(appointment._id)
      .populate('host_id', 'name username profile_picture')
      .populate('client_id', 'name username profile_picture');

    // Broadcast the appointment to the room via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(conversation_id.toString()).emit('newAppointment', {
        ...populatedApt.toObject(),
        conversationId: conversation_id
      });
    }

    res.status(201).json(appointment);

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// --------------------------------------------------
// PUT /api/appointments/:id/accept
// --------------------------------------------------
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only recipient can accept this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: `Appointment already ${appointment.status}` });
    }

    appointment.status = 'accepted';
    await appointment.save();

    const io = req.app.get('io');
    if (io) {
      console.log("Appointment updated:", appointment);
      io.to(appointment.conversation_id.toString()).emit('appointmentUpdated', appointment.toObject());
    }

    res.status(200).json({
      message: 'Appointment accepted',
      appointment
    });

  } catch (error) {
    console.error('Accept appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// --------------------------------------------------
// PUT /api/appointments/:id/reject
// --------------------------------------------------
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.client_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only recipient can reject this appointment' });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: `Appointment already ${appointment.status}` });
    }

    appointment.status = 'rejected';
    await appointment.save();

    const io = req.app.get('io');
    if (io) {
      console.log("Appointment updated:", appointment);
      io.to(appointment.conversation_id.toString()).emit('appointmentUpdated', appointment.toObject());
    }

    res.status(200).json({
      message: 'Appointment rejected',
      appointment
    });

  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// --------------------------------------------------
// GET /api/appointments
// Get upcoming accepted appointments
// --------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();

    const appointments = await Appointment.find({
      $or: [
        { host_id: req.user.id },
        { client_id: req.user.id }
      ],
      status: 'accepted',
      scheduled_for: { $gte: now }
    })
      .populate('host_id', 'name username')
      .populate('client_id', 'name username')
      .sort({ scheduled_for: 1 });

    res.status(200).json(appointments);

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------------------------------------
// DELETE /api/appointments/:id
// Cancel an appointment
// --------------------------------------------------
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const io = req.app.get('io');
    if (io) {
      console.log("Appointment cancelled:", appointment);
      io.to(appointment.conversation_id.toString()).emit('appointmentUpdated', appointment.toObject());
    }

    res.status(200).json({ message: 'Appointment cancelled', appointment });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;