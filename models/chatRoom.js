const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderType'
    },
    senderType: {
        type: String,
        required: true,
        enum: ['Victim', 'Admin', 'Counselor', 'Anonymous']
    },
    messageType: {
        type: String,
        required: true,
        enum: ['text', 'voice', 'file']
    },
    content: {
        type: String,
        required: true // For text messages and file/voice URLs
    },
    fileName: {
        type: String,
        // Optional, only for file attachments
    },
    fileSize: {
        type: Number,
        // Optional, only for file attachments
    },
    duration: {
        type: Number,
        // Optional, only for voice messages (duration in seconds)
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const chatRoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    victimType: {
        type: String,
        required: true,
        enum: ['registered', 'anonymous']
    },
    victimId: {
        type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
        required: true,
        // Custom validation to ensure correct type based on victimType
        validate: {
            validator: function(v) {
                if (this.victimType === 'registered') {
                    return mongoose.Types.ObjectId.isValid(v);
                }
                return typeof v === 'string';
            },
            message: 'Invalid victim identifier for the specified victim type'
        }
    },
    victimRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Only required for registered victims
        required: function() {
            return this.victimType === 'registered';
        }
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Admin'
    },
    counselorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Counselor'
    },
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // This will automatically update the updatedAt timestamp
});

// Create indexes for better query performance
chatRoomSchema.index({ roomId: 1 });
chatRoomSchema.index({ victimId: 1 });
chatRoomSchema.index({ counselorId: 1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom; 