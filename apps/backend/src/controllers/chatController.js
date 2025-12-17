const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

// Helper function to create system messages
const createSystemMessage = async (chatId, type, userName) => {
  let content = '';
  switch (type) {
    case 'group_created':
      content = 'You created group';
      break;
    case 'user_added':
      content = `${userName} was added`;
      break;
    case 'user_removed':
      content = `${userName} was removed`;
      break;
    case 'user_left':
      content = `${userName} left`;
      break;
    case 'user_joined':
      content = `${userName} joined`;
      break;
    default:
      content = 'Group updated';
  }

  const systemMessage = await Message.create({
    content,
    chat: chatId,
    isSystemMessage: true,
    systemMessageType: type,
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: systemMessage });
  return systemMessage;
};

exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.sendStatus(400);
  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  }).populate('users', '-password').populate('latestMessage');
  if (chat) return res.json(chat);
  chat = await Chat.create({
    chatName: 'sender',
    isGroupChat: false,
    users: [req.user._id, userId],
  });
  chat = await Chat.findById(chat._id).populate('users', '-password').populate('latestMessage');
  res.status(201).json(chat);
};

exports.fetchChats = async (req, res) => {
  const chats = await Chat.find({ users: { $in: [req.user._id] } })
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .populate('latestMessage')
    .sort({ updatedAt: -1 });
  res.json(chats);
};

exports.createGroupChat = async (req, res) => {
  let { users, name } = req.body;
  if (!users || !name) return res.status(400).json({ message: 'All fields required' });
  users = JSON.parse(users);
  if (users.length < 2) return res.status(400).json({ message: 'At least 2 users required' });
  users.push(req.user._id);
  const groupChat = await Chat.create({
    chatName: name,
    users,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  // Create system message for group creation
  await createSystemMessage(groupChat._id, 'group_created');

  const fullGroup = await Chat.findById(groupChat._id)
    .populate('users', '-password')
    .populate('groupAdmin', '-password');
  res.status(201).json(fullGroup);
};

exports.renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.groupAdmin.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only admin can rename group' });
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  ).populate('users', '-password').populate('groupAdmin', '-password');
  if (!updatedChat) return res.status(404).json({ message: 'Chat not found' });
  res.json(updatedChat);
};

exports.addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.groupAdmin.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only admin can add members' });

  // Get user details for system message
  const userToAdd = await User.findById(userId);

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  ).populate('users', '-password').populate('groupAdmin', '-password');

  if (!added) return res.status(404).json({ message: 'Chat not found' });

  // Create system message
  await createSystemMessage(chatId, 'user_added', userToAdd.name);

  res.json(added);
};

exports.removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.groupAdmin.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only admin can remove members' });

  // Get user details for system message
  const userToRemove = await User.findById(userId);

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  ).populate('users', '-password').populate('groupAdmin', '-password');

  if (!removed) return res.status(404).json({ message: 'Chat not found' });

  // Create system message
  await createSystemMessage(chatId, 'user_removed', userToRemove.name);

  res.json(removed);
};

exports.exitGroup = async (req, res) => {
  const { chatId } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (!chat.users.includes(req.user._id))
    return res.status(400).json({ message: 'You are not in this group' });

  // If admin is leaving, transfer admin to another user or prevent if last user
  if (chat.groupAdmin.toString() === req.user._id.toString()) {
    const otherUsers = chat.users.filter(u => u.toString() !== req.user._id.toString());
    if (otherUsers.length > 0) {
      chat.groupAdmin = otherUsers[0];
      await chat.save();
    }
  }

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: req.user._id } },
    { new: true }
  ).populate('users', '-password').populate('groupAdmin', '-password');

  if (!updated) return res.status(404).json({ message: 'Chat not found' });

  // Create system message
  await createSystemMessage(chatId, 'user_left', req.user.name);

  res.json({ message: 'Left group successfully', chat: updated });
};

exports.deleteGroup = async (req, res) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (chat.isGroupChat) {
    if (chat.groupAdmin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only admin can delete group' });

    // Delete all messages in the group
    await Message.deleteMany({ chat: chatId });
    // Delete the chat
    await Chat.findByIdAndDelete(chatId);
    return res.json({ message: 'Group deleted successfully' });
  }

  // For 1-1 chats, remove the current user from the chat so it's no longer visible to them
  // and mark all messages in that chat as deleted for the user
  await Chat.findByIdAndUpdate(chatId, { $pull: { users: req.user._id } }, { new: true });
  await Message.updateMany({ chat: chatId, deletedFor: { $nin: [req.user._id] } }, { $push: { deletedFor: req.user._id } });
  // If resulting chat has no users left, delete it entirely
  const rem = await Chat.findById(chatId).lean();
  if (!rem || rem.users.length === 0) {
    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
  }
  return res.json({ message: 'Chat removed for user' });
};

exports.togglePin = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  if (!chat.pinnedBy) chat.pinnedBy = [];
  const already = chat.pinnedBy.some(u => u.toString() === userId.toString());
  if (already) {
    chat.pinnedBy = chat.pinnedBy.filter(u => u.toString() !== userId.toString());
  } else {
    chat.pinnedBy.push(userId);
  }
  await chat.save();
  res.json(chat);
};
