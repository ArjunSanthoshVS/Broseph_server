const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/admin/chatController');
const adminAuth = require('../../middleware/admin/adminAuth');
const upload = require('../../middleware/multer');

// All routes are prefixed with /admin/chat
router.use(adminAuth);

// Get all victims with their last messages
router.get('/victims', chatController.getVictims);

// Get messages for a specific chat room
router.get('/:roomId/messages', chatController.getMessages);

// Send a message
router.post('/:roomId/messages', chatController.sendMessage);

// Mark messages as read
router.post('/:roomId/read', chatController.markAsRead);

// Upload file or voice message
router.post('/:roomId/upload', upload.single('file'), chatController.uploadFile);

module.exports = router; 