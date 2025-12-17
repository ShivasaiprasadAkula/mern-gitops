const express = require('express');
const { sendMessage, fetchMessages, toggleStar, addReaction, deleteForMe, forwardMessage, deleteForEveryone } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:chatId', protect, fetchMessages);
router.patch('/:messageId/star', protect, toggleStar);
router.patch('/:messageId/reaction', protect, addReaction);
router.delete('/:messageId/delete-for-me', protect, deleteForMe);
router.post('/:messageId/forward', protect, forwardMessage);
router.delete('/:messageId/delete-for-everyone', protect, deleteForEveryone);

module.exports = router;
