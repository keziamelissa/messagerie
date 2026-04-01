const sequelize = require('../config/database');
const User = require('./User');
const Conversation = require('./Conversation');
const ConversationMember = require('./ConversationMember');
const Message = require('./Message');
const Notification = require('./Notification');

// Define associations
User.hasMany(ConversationMember, { foreignKey: 'userId' });
ConversationMember.belongsTo(User, { foreignKey: 'userId' });

Conversation.hasMany(ConversationMember, { foreignKey: 'conversationId' });
ConversationMember.belongsTo(Conversation, { foreignKey: 'conversationId' });

User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Conversation,
  ConversationMember,
  Message,
  Notification
};
