import jwt from 'jsonwebtoken';

export const initializeSocketIO = (io) => {
  // Store connected users with their presence info
  const users = new Map(); // userId -> { socketId, status, lastSeen }
  const onlineUsers = new Set(); // Track which users are currently online

  // Middleware: Authenticate Socket.IO connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Broadcast online users list to all clients
  const broadcastOnlineUsers = () => {
    const onlineList = Array.from(onlineUsers);
    io.emit('onlineUsersUpdate', { onlineUsers: onlineList });
  };

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (User: ${socket.userId})`);

    // User comes online with their ID
    socket.on('userOnline', (userId) => {
      // Use authenticated userId from socket instead of client-provided userId
      const authenticatedUserId = socket.userId;
      if (!authenticatedUserId) return;

      users.set(authenticatedUserId, {
        socketId: socket.id,
        status: 'online',
        connectedAt: new Date(),
        lastSeen: new Date()
      });

      onlineUsers.add(authenticatedUserId);
      socket.join(authenticatedUserId);

      // Broadcast updated online users to everyone
      broadcastOnlineUsers();

      // Notify others that this user is online
      io.emit('userStatusChanged', {
        userId: authenticatedUserId,
        status: 'online',
        lastSeen: new Date()
      });

      console.log(`User ${authenticatedUserId} is online`);
    });

    // Explicit user offline event (triggered on page close/tab close)
    socket.on('userOffline', (userId) => {
      const authenticatedUserId = socket.userId;
      if (!authenticatedUserId) return;

      // Mark user as offline
      const userData = users.get(authenticatedUserId);
      if (userData) {
        userData.status = 'offline';
        userData.lastSeen = new Date();
        onlineUsers.delete(authenticatedUserId);

        // Notify others that this user is offline
        io.emit('userStatusChanged', {
          userId: authenticatedUserId,
          status: 'offline',
          lastSeen: userData.lastSeen
        });

        console.log(`User ${authenticatedUserId} explicitly went offline`);
      }

      broadcastOnlineUsers();
    });

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Send message
    socket.on('sendMessage', (data) => {
      const { conversationId, receiverId, message, senderId } = data;

      // Update sender's last active
      if (users.has(senderId)) {
        const user = users.get(senderId);
        user.lastSeen = new Date();
      }
      
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

    // Edit message
    socket.on('editMessage', (data) => {
      console.log('DEBUG: Received editMessage event:', data);
      const { conversationId, messageId, content, editedAt, senderId } = data;

      // Update sender's last active
      if (users.has(senderId)) {
        const user = users.get(senderId);
        user.lastSeen = new Date();
      }
      
      // Emit to conversation room
      console.log('DEBUG: Broadcasting messageEdited to room:', conversationId);
      io.to(conversationId).emit('messageEdited', {
        messageId,
        content,
        editedAt,
        senderId
      });
      console.log('DEBUG: Broadcast complete for room:', conversationId);
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
      
      const userId = socket.userId;
      // Mark user as offline and update last seen
      for (const [storedUserId, userData] of users.entries()) {
        if (userData.socketId === socket.id) {
          userData.status = 'offline';
          userData.lastSeen = new Date();
          onlineUsers.delete(storedUserId);

          // Notify others that this user is offline
          io.emit('userStatusChanged', {
            userId: storedUserId,
            status: 'offline',
            lastSeen: userData.lastSeen
          });

          console.log(`User ${storedUserId} is offline`);
          break;
        }
      }

      broadcastOnlineUsers();
    });
  });

  // Expose presence data globally (for API access)
  global.presenceData = {
    users,
    onlineUsers,
    getOnlineStatus: (userId) => {
      if (onlineUsers.has(userId)) {
        return { status: 'online', lastSeen: null };
      }
      const user = users.get(userId);
      return { status: 'offline', lastSeen: user?.lastSeen || null };
    },
    getOnlineUsers: () => Array.from(onlineUsers),
    getUserPresence: (userId) => users.get(userId) || null
  };

  return io;
};
