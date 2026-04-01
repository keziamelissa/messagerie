const { Notification } = require('../models');
const { Op } = require('sequelize');

const notificationController = {
  // Get all notifications for user
  getUserNotifications: async (req, res) => {
    try {
      const notifications = await Notification.findAll({
        where: { userId: req.userId },
        order: [['createdAt', 'DESC']]
      });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get unread notifications count
  getUnreadCount: async (req, res) => {
    try {
      const count = await Notification.count({
        where: {
          userId: req.userId,
          isRead: false
        }
      });
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findOne({
        where: {
          id: req.params.id,
          userId: req.userId
        }
      });
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      await notification.update({ isRead: true });
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Mark all as read
  markAllAsRead: async (req, res) => {
    try {
      await Notification.update(
        { isRead: true },
        {
          where: {
            userId: req.userId,
            isRead: false
          }
        }
      );
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const notification = await Notification.findOne({
        where: {
          id: req.params.id,
          userId: req.userId
        }
      });
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      await notification.destroy();
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = notificationController;
