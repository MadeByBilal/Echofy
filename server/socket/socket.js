const onlineUsers = {}

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("user_online", (userId) => {
      onlineUsers[userId] = socket.id
      io.emit("online_users", Object.keys(onlineUsers))
    })

    socket.on("disconnect", () => {
      const userId = Object.keys(onlineUsers).find(
        key => onlineUsers[key] === socket.id
      )
      if (userId) {
        delete onlineUsers[userId]
        io.emit("online_users", Object.keys(onlineUsers))
      }
      console.log("User disconnected:", socket.id)
    })
  })
}

module.exports = { initSocket, onlineUsers }