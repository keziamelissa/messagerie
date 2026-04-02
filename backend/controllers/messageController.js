const { Message, Conversation, ConversationMember, Notification, User } = require('../models');

// Store io instance (will be set from app.js)
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
  console.log('[Controller] SocketIO instance set:', io ? 'Yes' : 'No');
};

const messageController = {
  // Create message
  createMessage: async (req, res) => {
    try {
      const { conversationId, content, type } = req.body;
      
      const conversation = await Conversation.findByPk(conversationId, {
        include: [ConversationMember]
      });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is member
      const isMember = conversation.ConversationMembers.some(
        m => m.userId === req.userId
      );
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const message = await Message.create({
        conversationId,
        senderId: req.userId,
        content,
        type: type || 'text'
      });
      
      const result = await Message.findByPk(message.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: { exclude: ['password'] }
        }]
      });
      
      // Create notifications for other members
      const otherMembers = conversation.ConversationMembers.filter(
        m => m.userId !== req.userId
      );
      
      const sender = await User.findByPk(req.userId);
      
      for (const member of otherMembers) {
        const notification = await Notification.create({
          userId: member.userId,
          type: 'message',
          content: `New message from ${sender.name}`
        });
        
        // Send notification to online users via WebSocket
        if (io) {
          const memberSockets = await io.in(`user_${member.userId}`).fetchSockets();
          console.log(`[Controller] Sending notification to user_${member.userId}, sockets found:`, memberSockets.length);
          memberSockets.forEach(s => {
            s.emit('notification', notification.toJSON ? notification.toJSON() : notification);
          });
        } else {
          console.warn('[Controller] io not available, cannot send notification');
        }
      }
      
      // Broadcast to conversation room via WebSocket
      if (io) {
        // Serialize to plain object to ensure proper format
        const messageJson = result.toJSON ? result.toJSON() : result;
        const roomName = `conv_${conversationId}`;
        
        // Debug: Check sockets in room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
        console.log(`[Controller] Room ${roomName} has ${socketsInRoom ? socketsInRoom.size : 0} sockets`);
        if (socketsInRoom) {
          console.log(`[Controller] Socket IDs in room:`, Array.from(socketsInRoom));
        }
        
        console.log(`[Controller] Broadcasting to room ${roomName}:`, messageJson.id);
        io.to(roomName).emit('new_message', messageJson);
        console.log(`[Controller] Broadcast complete`);
      } else {
        console.warn('[Controller] io not available, cannot broadcast');
      }
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get messages by conversation
  getMessagesByConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      const conversation = await Conversation.findByPk(conversationId, {
        include: [ConversationMember]
      });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if user is member
      const isMember = conversation.ConversationMembers.some(
        m => m.userId === req.userId
      );
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      const messages = await Message.findAll({
        where: { conversationId },
        include: [{
          model: User,
          as: 'sender',
          attributes: { exclude: ['password'] }
        }],
        order: [['createdAt', 'ASC']]
      });
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Mark message as read
  markAsRead: async (req, res) => {
    try {
      const message = await Message.findByPk(req.params.id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      const conversation = await Conversation.findByPk(message.conversationId, {
        include: [ConversationMember]
      });
      
      // Check if user is member
      const isMember = conversation.ConversationMembers.some(
        m => m.userId === req.userId
      );
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await message.update({ isRead: true });
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete message
  deleteMessage: async (req, res) => {
    try {
      const message = await Message.findByPk(req.params.id);
      
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      // Only sender can delete
      if (message.senderId !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      await message.destroy();
      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = { messageController, setSocketIO };
