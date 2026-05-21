const Message = require("../models/Message.model");

const onlineUsers = {};

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // user comes online
    socket.on("user_online", async (userId) => {
      onlineUsers[userId] = socket.id;
      io.emit("online_users", Object.keys(onlineUsers));

      try {
        // Find all undelivered messages sent to this user
        const undeliveredMessages = await Message.find({
          receiverId: userId,
          status: "sent",
        });

        if (undeliveredMessages.length > 0) {
          // Update them to delivered
          await Message.updateMany(
            { receiverId: userId, status: "sent" },
            { status: "delivered" },
          );

          // Notify each sender that their messages are now delivered
          const senderIds = [
            ...new Set(undeliveredMessages.map((m) => m.senderId.toString())),
          ];
          senderIds.forEach((senderId) => {
            const senderSocketId = onlineUsers[senderId];
            if (senderSocketId) {
              io.to(senderSocketId).emit("messages_delivered", {
                receiverId: userId,
                messageIds: undeliveredMessages
                  .filter((m) => m.senderId.toString() === senderId)
                  .map((m) => m._id),
              });
            }
          });
        }
      } catch (error) {
        console.log("Error updating delivered status:", error);
      }
    });

    // user opens a chat — mark messages as seen
    socket.on("messages_seen", async ({ senderId, receiverId }) => {
      try {
        // update all unseen messages to seen
        await Message.updateMany(
          { senderId, receiverId, status: { $ne: "seen" } },
          { status: "seen" },
        );

        // tell the sender their messages were seen
        const senderSocketId = onlineUsers[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_seen", { senderId, receiverId });
        }
      } catch (error) {
        console.log("Error updating seen status:", error);
      }
    });

    // user disconnects
    socket.on("disconnect", () => {
      const userId = Object.keys(onlineUsers).find(
        (key) => onlineUsers[key] === socket.id,
      );
      if (userId) {
        delete onlineUsers[userId];
        io.emit("online_users", Object.keys(onlineUsers));
      }
    });
  });
};

module.exports = { initSocket, onlineUsers };
