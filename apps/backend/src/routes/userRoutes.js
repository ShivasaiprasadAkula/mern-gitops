const express = require('express');
const { register, login, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', protect, searchUsers);

module.exports = router;
