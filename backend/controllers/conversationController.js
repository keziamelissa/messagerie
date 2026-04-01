const { Conversation, ConversationMember, Message, User } = require('../models');
const { Op } = require('sequelize');

const conversationController = {
  // Create conversation (private or group)
  createConversation: async (req, res) => {
    try {
      const { members, isGroup, groupName } = req.body;
      
      if (!isGroup && members.length !== 2) {
        return res.status(400).json({ message: 'Private conversation requires exactly 2 members' });
      }
      
      // Check if private conversation already exists
      if (!isGroup) {
        const memberConvs = await ConversationMember.findAll({
          where: { userId: members[0] },
          include: [{
            model: Conversation,
            where: { isGroup: false }
          }]
        });
        
        for (const mc of memberConvs) {
          const otherMembers = await ConversationMember.findAll({
            where: { conversationId: mc.conversationId }
          });
          const memberIds = otherMembers.map(m => m.userId);
          if (memberIds.includes(members[1])) {
            return res.status(400).json({ message: 'Conversation already exists' });
          }
        }
      }
      
      const conversation = await Conversation.create({
        isGroup: isGroup || false,
        groupName: groupName || null
      });
      
      // Add members
      for (const memberId of members) {
        await ConversationMember.create({
          conversationId: conversation.id,
          userId: memberId
        });
      }
      
      const result = await Conversation.findByPk(conversation.id, {
        include: [{
          model: ConversationMember,
          include: [{
            model: User,
            attributes: { exclude: ['password'] }
          }]
        }]
      });
      
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all conversations for a user
  getUserConversations: async (req, res) => {
    try {
      const memberRecords = await ConversationMember.findAll({
        where: { userId: req.userId },
        include: [{
          model: Conversation,
          include: [{
            model: ConversationMember,
            include: [{
              model: User,
              attributes: { exclude: ['password'] }
            }]
          }]
        }]
      });
      
      const conversations = memberRecords.map(m => m.Conversation);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get conversation by ID
  getConversationById: async (req, res) => {
    try {
      const conversation = await Conversation.findByPk(req.params.id, {
        include: [{
          model: ConversationMember,
          include: [{
            model: User,
            attributes: { exclude: ['password'] }
          }]
        }]
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
      
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update conversation (group name, add/remove members)
  updateConversation: async (req, res) => {
    try {
      const { groupName, members } = req.body;
      const conversation = await Conversation.findByPk(req.params.id, {
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
      
      if (groupName) await conversation.update({ groupName });
      
      // Update members if provided
      if (members) {
        await ConversationMember.destroy({ where: { conversationId: req.params.id } });
        for (const memberId of members) {
          await ConversationMember.create({
            conversationId: req.params.id,
            userId: memberId
          });
        }
      }
      
      const result = await Conversation.findByPk(req.params.id, {
        include: [{
          model: ConversationMember,
          include: [{
            model: User,
            attributes: { exclude: ['password'] }
          }]
        }]
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete conversation
  deleteConversation: async (req, res) => {
    try {
      const conversation = await Conversation.findByPk(req.params.id, {
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
      
      // Delete all related data
      await Message.destroy({ where: { conversationId: req.params.id } });
      await ConversationMember.destroy({ where: { conversationId: req.params.id } });
      await conversation.destroy();
      
      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = conversationController;
