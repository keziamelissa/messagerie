require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sequelize, User, Conversation, ConversationMember, Message, Notification } = require('./models');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');
const { setSocketIO } = require('./controllers/messageController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST']
  }
});

// Pass io instance to controllers
setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handler
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.userId})`);
  
  // Update user status to online and join user-specific room
  await User.update({ status: 'online' }, { where: { id: socket.userId } });
  socket.join(`user_${socket.userId}`);
  io.emit('user_status_change', { userId: socket.userId, status: 'online' });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
    console.log(`[Socket] ${socket.user.name} joined conversation ${conversationId}`);
    console.log(`[Socket] Socket rooms:`, Array.from(socket.rooms));
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv_${conversationId}`);
    console.log(`[Socket] ${socket.user.name} left conversation ${conversationId}`);
    console.log(`[Socket] Socket rooms:`, Array.from(socket.rooms));
  });

  // Handle send message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text' } = data;

      // Verify user is member of conversation
      const isMember = await ConversationMember.findOne({
        where: { conversationId, userId: socket.userId }
      });

      if (!isMember) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      // Create message
      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        content,
        type
      });

      // Fetch complete message with sender
      const fullMessage = await Message.findByPk(message.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: { exclude: ['password'] }
        }]
      });

      // Broadcast to conversation room
      io.to(`conv_${conversationId}`).emit('new_message', fullMessage);

      // Get other members and create notifications
      const otherMembers = await ConversationMember.findAll({
        where: { conversationId, userId: { not: socket.userId } }
      });

      for (const member of otherMembers) {
        // Create notification
        const notification = await Notification.create({
          userId: member.userId,
          conversationId: conversationId,
          type: 'message',
          content: `Nouveau message de ${socket.user.name}`
        });

        // Send notification to online users
        const memberSockets = await io.in(`user_${member.userId}`).fetchSockets();
        memberSockets.forEach(s => {
          s.emit('notification', notification.toJSON());
        });
      }
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`conv_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.user.name
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.user.name} (${socket.userId})`);
    // Update user status to offline
    await User.update({ status: 'offline' }, { where: { id: socket.userId } });
    io.emit('user_status_change', { userId: socket.userId, status: 'offline' });
  });
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server ready`);
    });
  })
  .catch(err => {
    console.error('Database synchronization error:', err);
  });