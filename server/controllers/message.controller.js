const Message = require('../models/Message.model')

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, replyTo } = req.body
    const senderId = req.user._id

    // check fields
    if (!receiverId || !text) {
      return res.status(400).json({ message: 'receiverId and text are required' })
    }

    // save message to DB
    const message = await Message.create({
      senderId,
      receiverId,
      text,
      replyTo: replyTo || null   // if no replyTo, set null
    })

    res.status(201).json({ message })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET CHAT HISTORY
const getChatHistory = async (req, res) => {
  try {
    const myId = req.user._id // Get sender id from the body
    const { userId } = req.params   // the other person's ID from url.

  
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userId },   // messages I sent
        { senderId: userId, receiverId: myId }    // messages I received
      ]
    })
    .populate('replyTo', 'text senderId')   // get original message if reply
    .sort({ createdAt: 1 })                 // oldest first

    res.status(200).json({ messages })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { sendMessage, getChatHistory }