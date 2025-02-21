const ChatRoom = require('../../models/chatRoom');
const path = require('path');
const fs = require('fs').promises;

// Get or create chat room
exports.getChatRoom = async (req, res) => {
    try {
        const userId = req.user?._id || req.anonymousId;
        const userType = req.user ? 'registered' : 'anonymous';

        // Try to find existing chat room
        let chatRoom = await ChatRoom.findOne({
            $or: [
                { victimId: userId },
                { victimRef: userId }
            ]
        });

        // If no chat room exists, create one
        if (!chatRoom) {
            chatRoom = new ChatRoom({
                roomId: userId.toString(), // Using user ID as room ID
                victimType: userType,
                victimId: userId,
                victimRef: userType === 'registered' ? userId : undefined,
                adminId: process.env.DEFAULT_ADMIN_ID // You should handle this appropriately
            });

            await chatRoom.save();
        } else {
            console.log('Found existing chat room:', chatRoom.roomId);
        }

        res.json({ roomId: chatRoom.roomId });
    } catch (error) {
        console.error('Get chat room error:', error);
        res.status(500).json({ error: 'Failed to get chat room' });
    }
};

// Get messages for a chat room
exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user?._id || req.anonymousId;

        const chatRoom = await ChatRoom.findOne({
            roomId,
            $or: [
                { victimId: userId },
                { victimRef: userId }
            ]
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
        const userId = req.user?._id || req.anonymousId;

        const chatRoom = await ChatRoom.findOne({
            roomId,
            $or: [
                { victimId: userId },
                { victimRef: userId }
            ]
        });

        if (!chatRoom) {
            return res.status(404).json({ error: 'Chat room not found' });
        }

        const message = {
            content,
            sender: userId,
            senderType: 'Victim',
            messageType,
            timestamp: new Date(),
            readBy: [userId]
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

// Upload file or voice message
exports.uploadFile = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { type } = req.body;
        const file = req.file;
        const userId = req.user?._id || req.anonymousId;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const chatRoom = await ChatRoom.findOne({
            roomId,
            $or: [
                { victimId: userId },
                { victimRef: userId }
            ]
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
            sender: userId,
            senderType: 'Victim',
            messageType: type,
            fileName: file.originalname,
            fileSize: file.size,
            timestamp: new Date(),
            readBy: [userId]
        };

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
                fileSize: message.fileSize
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