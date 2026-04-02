const express = require('express');
const router = express.Router();
const { messageController } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.post('/', messageController.createMessage);
router.get('/conversation/:conversationId', messageController.getMessagesByConversation);
router.put('/:id/read', messageController.markAsRead);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
