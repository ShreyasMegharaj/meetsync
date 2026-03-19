const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    from_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate requests between two specific users
requestSchema.index({ from_user: 1, to_user: 1 }, { unique: true });

module.exports = mongoose.model('Request', requestSchema);
