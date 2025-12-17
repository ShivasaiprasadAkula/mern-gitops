const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  const { content, chatId, replyTo, isForwarded, forwardedFrom } = req.body;
  if (!content || !chatId) return res.status(400).json({ message: 'Invalid data' });
  let message = await Message.create({
    sender: req.user._id,
    content,
    chat: chatId,
    replyTo: replyTo || null,
    isForwarded: !!isForwarded,
    forwardedFrom: forwardedFrom || null,
  });
  message = await message.populate('sender', 'name email avatar');
  message = await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } });
  message = await message.populate({ path: 'forwardedFrom', populate: { path: 'sender', select: 'name avatar' } });
  message = await message.populate('chat');
  const fullChat = await Chat.findById(chatId).populate('users', '-password').populate('groupAdmin', '-password');
  message.chat = fullChat;
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
  res.json(message);
};

exports.fetchMessages = async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId, deletedFor: { $nin: [req.user._id] } })
    .populate('sender', 'name email avatar')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } })
    .populate({ path: 'forwardedFrom', populate: { path: 'sender', select: 'name avatar' } })
    .populate({ path: 'chat', populate: { path: 'users groupAdmin', select: '-password' } });
  res.json(messages);
};

exports.toggleStar = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  const already = message.starredBy?.some(u => u.toString() === userId.toString());
  if (already) {
    message.starredBy = message.starredBy.filter(u => u.toString() !== userId.toString());
  } else {
    message.starredBy = [...(message.starredBy || []), userId];
  }
  await message.save();
  const io = require('../socketIO').getIO();
  if (io) io.to(message.chat.toString()).emit('message updated', message);
  res.json(message);
};

exports.addReaction = async (req, res) => {
  const { messageId } = req.params;
  const { reaction } = req.body;
  if (!reaction) return res.status(400).json({ message: 'Reaction required' });
  const userId = req.user._id;
  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  const existing = (message.reactions || []).find(r => r.user.toString() === userId.toString());
  if (existing) {
    if (existing.reaction === reaction) {
      // toggle off
      message.reactions = (message.reactions || []).filter(r => r.user.toString() !== userId.toString());
    } else {
      existing.reaction = reaction; // change
    }
  } else {
    message.reactions = [...(message.reactions || []), { user: userId, reaction }];
  }
  await message.save();
  const io = require('../socketIO').getIO();
  if (io) io.to(message.chat.toString()).emit('message updated', message);
  res.json(message);
};

exports.deleteForMe = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  if (!message.deletedFor) message.deletedFor = [];
  if (!message.deletedFor.some(u => u.toString() === userId.toString())) {
    message.deletedFor.push(userId);
    await message.save();
  }
  const io = require('../socketIO').getIO();
  if (io) io.to(message.chat.toString()).emit('message deleted for me', { messageId, userId });
  res.json({ message: 'Deleted for me', messageId });
};

exports.deleteForEveryone = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;
  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  // Only sender can delete for everyone
  if (message.sender.toString() !== userId.toString()) return res.status(403).json({ message: 'Not authorized to delete for everyone' });
  message.deletedForAll = true;
  message.deletedBy = userId;
  message.isDeleted = true;
  await message.save();
  const io = require('../socketIO').getIO();
  if (io) io.to(message.chat.toString()).emit('message deleted', { messageId });
  res.json({ message: 'Deleted for everyone', messageId });
};

exports.forwardMessage = async (req, res) => {
  const { messageId } = req.params;
  const { chatIds, userIds } = req.body; // accept chatIds or userIds
  if ((!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
    return res.status(400).json({ message: 'chatIds or userIds required' });
  }
  const orig = await Message.findById(messageId);
  if (!orig) return res.status(404).json({ message: 'Original message not found' });
  const created = [];
  try {
  // Helper that takes a chatId and creates a forwarded message
  const createForwardedForChat = async (chatId) => {
    const m = await Message.create({
      sender: req.user._id,
      content: orig.content,
      chat: chatId,
      isForwarded: true,
      forwardedFrom: orig._id,
    });
    // Re-query to populate fields without chaining on the returned doc
    const full = await Message.findById(m._id)
      .populate('sender', 'name email avatar')
      .populate({ path: 'chat', populate: { path: 'users groupAdmin', select: '-password' } });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: full._id });
    const io = require('../socketIO').getIO();
    if (io) io.to(chatId.toString()).emit('message received', full);
    created.push(full);
  };

  if (chatIds && chatIds.length) {
    for (const chatId of chatIds) {
      // Only allow forwarding to existing chats passed as ids
      await createForwardedForChat(chatId);
    }
  }

  if (userIds && userIds.length) {
    for (const userId of userIds) {
      // find or create a direct chat between current user and userId
      let chat = await Chat.findOne({ isGroupChat: false, users: { $all: [req.user._id, userId] } });
      if (!chat) {
        chat = await Chat.create({ chatName: 'sender', isGroupChat: false, users: [req.user._id, userId] });
        chat = await Chat.findById(chat._id).populate('users', '-password').populate('latestMessage');
      }
      await createForwardedForChat(chat._id);
    }
  }
  } catch (err) {
    console.error('Error forwarding message:', err);
    return res.status(500).json({ message: 'Failed to forward message', error: err.message });
  }
  res.json({ forwarded: created });
};
