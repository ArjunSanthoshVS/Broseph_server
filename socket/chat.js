const socketIo = require('socket.io');
const ChatRoom = require('../models/chatRoom');

let io;

module.exports = {
    init: (server) => {
        io = socketIo(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join a chat room
            socket.on('join_room', (roomId) => {
                socket.join(roomId);
                console.log(`User joined room: ${roomId}`);
            });

            // Leave a chat room
            socket.on('leave_room', (roomId) => {
                socket.leave(roomId);
                console.log(`User left room: ${roomId}`);
            });

            // Handle new message
            socket.on('send_message', async (data) => {

                try {
                    const { roomId, message } = data;

                    const chatRoom = await ChatRoom.findOne({ roomId });
                    if (!chatRoom) {
                        console.error('Chat room not found:', roomId);
                        socket.emit('error', { message: 'Chat room not found' });
                        return;
                    }

                    const broadcastMessage = {
                        id: new Date().getTime(),
                        content: message.content,
                        sender: message.sender || message.anonymousId,
                        senderType: message.senderType,
                        timestamp: new Date(),
                        messageType: 'text'
                    };

                    io.to(roomId).emit('receive_message', broadcastMessage);

                } catch (error) {
                    console.error('Message handling error:', error);
                    console.error('Error stack:', error.stack);
                    if (error.errors) {
                        console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
                    }
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle typing status
            socket.on('typing_start', (roomId) => {
                socket.to(roomId).emit('user_typing_start');
            });

            socket.on('typing_stop', (roomId) => {
                socket.to(roomId).emit('user_typing_stop');
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    },
};
