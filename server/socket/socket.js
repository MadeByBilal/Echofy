const Message = require('../models/Message.model')

const onlineUsers = {}

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    // user comes online
    socket.on("user_online", (userId) => {
      onlineUsers[userId] = socket.id
      io.emit("online_users", Object.keys(onlineUsers))
    })

    // user opens a chat — mark messages as seen
    socket.on("messages_seen", async ({ senderId, receiverId }) => {
      try {
        // update all unseen messages to seen
        await Message.updateMany(
          { senderId, receiverId, status: { $ne: 'seen' } },
          { status: 'seen' }
        )

        // tell the sender their messages were seen
        const senderSocketId = onlineUsers[senderId]
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_seen', { senderId, receiverId })
        }

      } catch (error) {
        console.log('Error updating seen status:', error)
      }
    })

    // user disconnects
    socket.on("disconnect", () => {
      const userId = Object.keys(onlineUsers).find(
        key => onlineUsers[key] === socket.id
      )
      if (userId) {
        delete onlineUsers[userId]
        io.emit("online_users", Object.keys(onlineUsers))
      }
    })
  })
}

module.exports = { initSocket, onlineUsers }