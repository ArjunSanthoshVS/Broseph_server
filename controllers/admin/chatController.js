const ChatRoom = require('../../models/chatRoom');
const User = require('../../models/user');
const path = require('path');
const fs = require('fs').promises;

// Get all victims with their last messages
exports.getVictims = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({
      adminId: req.admin._id
    }).populate('victimRef', 'name');

    const victims = await Promise.all(chatRooms.map(async (room) => {
      // Get last message
      const lastMessage = room.messages[room.messages.length - 1];

      // Count unread messages (messages not from admin)
      const unreadCount = room.messages.filter(
        msg => msg.senderType === 'Victim' && !msg.readBy?.includes(req.admin._id)
      ).length;

      return {
        id: room.roomId,
        name: room.victimType === 'registered' ? room.victimRef.name : room.victimId,
        type: room.victimType,
        lastMessage: lastMessage?.content,
        lastMessageTime: lastMessage?.timestamp,
        unreadCount
      };
    }));

    res.json({ victims });
  } catch (error) {
    console.error('Get victims error:', error);
    res.status(500).json({ error: 'Failed to get victims list' });
  }
};

// Get messages for a specific chat room
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findOne({
      roomId,
      adminId: req.admin._id
    });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const messages = chatRoom.messages.map(msg => ({
      id: msg._id,
      content: msg.content,
      sender: msg.sender,
      senderType: msg.senderType,
      timestamp: msg.timestamp,
      messageType: msg.messageType,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      duration: msg.duration
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = 'text' } = req.body;

    const chatRoom = await ChatRoom.findOne({
      roomId,
      adminId: req.admin._id
    });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    const message = {
      content,
      sender: req.admin._id,
      senderType: 'Admin',
      messageType,
      timestamp: new Date(),
      readBy: [req.admin._id] // Admin has read their own message
    };

    chatRoom.messages.push(message);
    await chatRoom.save();

    res.json({
      message: {
        id: message._id,
        content: message.content,
        sender: message.sender,
        senderType: message.senderType,
        timestamp: message.timestamp,
        messageType: message.messageType
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findOne({
      roomId,
      adminId: req.admin._id
    });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Mark all messages as read by adding admin ID to readBy array
    chatRoom.messages = chatRoom.messages.map(msg => {
      if (!msg.readBy.includes(req.admin._id)) {
        msg.readBy.push(req.admin._id);
      }
      return msg;
    });

    await chatRoom.save();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Upload file or voice message
exports.uploadFile = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const chatRoom = await ChatRoom.findOne({
      roomId,
      adminId: req.admin._id
    });

    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Create chat room directory if it doesn't exist
    const chatDir = path.join('public', 'uploads', 'chat', roomId, type);
    await fs.mkdir(chatDir, { recursive: true });

    // Move file to permanent location
    const fileName = file.filename;
    const permanentPath = path.join(chatDir, fileName);
    await fs.rename(file.path, permanentPath);

    // Create public URL for the file
    const fileUrl = `/uploads/chat/${roomId}/${type}/${fileName}`;

    // Create message with file details
    const message = {
      content: fileUrl,
      sender: req.admin._id,
      senderType: 'Admin',
      messageType: type,
      fileName: file.originalname,
      fileSize: file.size,
      timestamp: new Date(),
      readBy: [req.admin._id]
    };

    if (type === 'voice') {
      // For voice messages, you might want to add duration
      // This would require additional processing of the audio file
      // message.duration = audioDuration;
    }

    chatRoom.messages.push(message);
    await chatRoom.save();

    res.json({
      url: fileUrl,
      message: {
        id: message._id,
        content: message.content,
        sender: message.sender,
        senderType: message.senderType,
        timestamp: message.timestamp,
        messageType: message.messageType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        duration: message.duration
      }
    });
  } catch (error) {
    // Clean up the temporary file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up temporary file:', unlinkError);
      }
    }
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}; 