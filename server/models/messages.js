const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true
    },

    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },

    message_type: {
      type: String,
      enum: ['text', 'image', 'appointment'],
      default: 'text',
    },

    message_text: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    image_url: {
      type: String,
      default: null,
    },

    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation_id: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);