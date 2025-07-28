import Message from '../models/messageCenter.model.js'
import User from '../models/user.model.js'

// @desc    Get all messages for a user
// @route   GET /api/messages
// @access  Private
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

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
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
        req.io.to(receiverId.toString()).emit('newMessage', populatedMessage)

        res.status(201).json(populatedMessage)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}