const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },

    host_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    scheduled_for: {
      type: Date,
      required: true
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },

    reminder_sent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index({ scheduled_for: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);