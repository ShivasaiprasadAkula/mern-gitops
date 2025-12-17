const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, trim: true },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isForwarded: { type: Boolean, default: false },
  forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reaction: String }],
  starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedForAll: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  isTyping: { type: Boolean, default: false },
  isSystemMessage: { type: Boolean, default: false },
  systemMessageType: {
    type: String,
    enum: ['user_added', 'user_removed', 'user_left', 'group_created', 'user_joined'],
    required: function () { return this.isSystemMessage; }
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
