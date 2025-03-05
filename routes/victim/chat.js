const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/victim/chatController');
const auth = require('../../middleware/victim/auth');
const upload = require('../../middleware/multer');

// Get or create chat room
router.get('/room', auth, chatController.getChatRoom);

// Get messages for a chat room
router.get('/:roomId/messages', auth, chatController.getMessages);

// Send a message
router.post('/:roomId/messages', auth, chatController.sendMessage);

// Upload file or voice message
router.post('/:roomId/upload', auth, upload.single('file'), chatController.uploadFile);

// Get report details by chat room ID
router.get('/report/:chatRoomId', auth, chatController.getReportByChatRoom);

module.exports = router;
