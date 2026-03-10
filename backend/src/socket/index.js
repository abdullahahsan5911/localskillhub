export const initializeSocketIO = (io) => {
  // Store connected users
  const users = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their ID
    socket.on('join', (userId) => {
      users.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} joined`);
    });

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);

    });

    // Send message
    socket.on('sendMessage', (data) => {
      const { conversationId, receiverId, message } = data;
      
      // Emit to conversation room
      io.to(conversationId).emit('newMessage', message);
      
      // Also emit to receiver's personal room
      if (users.has(receiverId)) {
        io.to(receiverId).emit('notification', {
          type: 'newMessage',
          data: message
        });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, userId } = data;
      socket.to(conversationId).emit('userTyping', { userId });
    });

    socket.on('stopTyping', (data) => {
      const { conversationId, userId } = data;
      socket.to(conversationId).emit('userStoppedTyping', { userId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      
      // Remove from users map
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};
