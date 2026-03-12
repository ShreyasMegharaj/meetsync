const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        }
      ],
      validate: {
        validator: function (val) {
          return val.length === 2;
        },
        message: 'A conversation must have exactly 2 participants',
      },
      index: true
    },

    last_message_at: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Conversation', conversationSchema);