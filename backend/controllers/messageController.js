const { Message, Conversation, ConversationMember, Notification, User } = require('../models');

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
        await Notification.create({
          userId: member.userId,
          type: 'message',
          content: `New message from ${sender.name}`
        });
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

module.exports = messageController;
