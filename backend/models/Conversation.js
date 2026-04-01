const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  groupName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'conversations',
  timestamps: true
});

module.exports = Conversation;
