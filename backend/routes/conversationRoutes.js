const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authMiddleware } = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.post('/', conversationController.createConversation);
router.get('/my', conversationController.getUserConversations);
router.get('/:id', conversationController.getConversationById);
router.put('/:id', conversationController.updateConversation);
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;
