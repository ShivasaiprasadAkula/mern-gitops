const express = require('express');
const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  exitGroup,
  deleteGroup,
  togglePin,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/group', protect, createGroupChat);
router.put('/rename', protect, renameGroup);
router.put('/groupadd', protect, addToGroup);
router.put('/groupremove', protect, removeFromGroup);
router.put('/exit', protect, exitGroup);
router.delete('/:chatId', protect, deleteGroup);
router.put('/:chatId/pin', protect, togglePin);

module.exports = router;
