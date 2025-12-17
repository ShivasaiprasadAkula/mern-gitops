const Message = require('./models/Message');
const Chat = require('./models/Chat');

const onlineUsers = new Map();

module.exports = (io, socket) => {
  // join a personal room for direct notifications
  if (socket.user && socket.user._id) {
    socket.join(socket.user._id);
    onlineUsers.set(socket.user._id.toString(), socket.id);
  }

  socket.on('setup', (id) => {
    if (id) {
      socket.join(id);
      onlineUsers.set(id, socket.id);
      socket.emit('connected');
    }
  });

  socket.on('join chat', (room) => {
    socket.join(room);
  });

  socket.on('typing', (room) => socket.to(room).emit('typing', { chatId: room, user: socket.user }));
  socket.on('stop typing', (room) => socket.to(room).emit('stop typing', { chatId: room, user: socket.user }));

  socket.on('new message', async (message) => {
    const chat = message.chat;
    if (!chat.users) return;

    chat.users.forEach(async (user) => {
      if (user._id == message.sender._id) return;

      // Check if user is online
      const isOnline = onlineUsers.has(user._id.toString());

      if (isOnline) {
        // Update message status to delivered
        try {
          await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
          // Notify sender that message is delivered
          socket.emit('message status update', { messageId: message._id, status: 'delivered', chatId: chat._id });
        } catch (error) {
          console.error("Error updating message status:", error);
        }
      }

      socket.to(user._id).emit('message received', message);
    });
  });

  socket.on('mark messages read', async ({ chatId, userId }) => {
    if (!chatId || !userId) return;

    try {
      // Update all messages in this chat sent by OTHER users to 'read'
      // Actually, we want to mark messages *received* by the current user as read.
      // So we look for messages in this chat where sender is NOT userId, and status is not 'read'.

      await Message.updateMany(
        { chat: chatId, sender: { $ne: userId }, status: { $ne: 'read' } },
        { $set: { status: 'read' } }
      );

      // Notify other users in the chat that messages have been read
      // We can emit to the chat room
      socket.to(chatId).emit('messages read', { chatId, readerId: userId });

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on('disconnect', () => {
    if (socket.user && socket.user._id) {
      onlineUsers.delete(socket.user._id.toString());
    }
  });

  // Listen for message actions through sockets (optional alternative to REST)
  socket.on('message action', async ({ type, messageId, data }) => {
    try {
      const userId = socket.user._id;
      if (!messageId) return;
      let msg = await Message.findById(messageId);
      if (!msg) return;
      switch (type) {
        case 'star':
          msg.starredBy = msg.starredBy || [];
          msg.starredBy = msg.starredBy.some(u => u.toString() === userId.toString()) ? msg.starredBy.filter(u => u.toString() !== userId.toString()) : [...msg.starredBy, userId];
          await msg.save();
          io.to(msg.chat.toString()).emit('message updated', msg);
          break;
        case 'reaction':
          msg.reactions = msg.reactions || [];
          const existing = msg.reactions.find(r => r.user.toString() === userId.toString());
          if (existing) {
            if (existing.reaction === data.reaction) msg.reactions = msg.reactions.filter(r => r.user.toString() !== userId.toString());
            else existing.reaction = data.reaction;
          } else msg.reactions.push({ user: userId, reaction: data.reaction });
          await msg.save();
          io.to(msg.chat.toString()).emit('message updated', msg);
          break;
        case 'deleteForMe':
          msg.deletedFor = msg.deletedFor || [];
          if (!msg.deletedFor.some(u => u.toString() === userId.toString())) msg.deletedFor.push(userId);
          await msg.save();
          io.to(msg.chat.toString()).emit('message deleted for me', { messageId, userId });
          break;
        case 'deleteForEveryone':
          if (msg.sender.toString() === userId.toString()) {
            msg.deletedForAll = true;
            msg.deletedBy = userId;
            msg.isDeleted = true;
            await msg.save();
            io.to(msg.chat.toString()).emit('message deleted', { messageId });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Socket message action error', error);
    }
  });
};
