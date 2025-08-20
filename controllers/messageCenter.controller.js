import Message from '../models/message.model.js'
import User from '../models/user.model.js'

export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
            .populate('sender', 'name avatar role')
            .populate('receiver', 'name avatar role')
            .sort({ createdAt: -1 })

        res.status(200).json(messages)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body
        const senderId = req.user._id

        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Please provide all required fields' })
        }

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        })

        const savedMessage = await message.save()
        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'name avatar role')
            .populate('receiver', 'name avatar role')

        // Emit the message to the receiver via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('newMessage',
                populatedMessage);
        }

        // req.io.to(receiverId.toString()).emit('newMessage', populatedMessage)

        res.status(201).json(populatedMessage)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getConversation = async (req, res) => {
    try {
        const userId = req.user._id
        const otherUserId = req.params.userId

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
            .populate('sender', 'name avatar role')
            .populate('receiver', 'name avatar role')
            .sort({ createdAt: 1 })

        res.status(200).json(messages)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user._id
        const senderId = req.params.senderId

        await Message.updateMany(
            {
                sender: senderId,
                receiver: userId,
                read: false
            },
            {
                $set: { read: true, readAt: new Date() }
            }
        )

        res.status(200).json({ message: 'Messages marked as read' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}