const Message = require("../models/Message.model");
const User = require("../models/User.model");

// Map of userId -> Set(socketId)
const onlineUsers = {};
// Map of userId -> timeoutId for delayed offline marking
const disconnectTimeouts = {};

// configurable timeout (ms) before marking user offline after last disconnect
const OFFLINE_TIMEOUT = process.env.OFFLINE_TIMEOUT_MS
  ? parseInt(process.env.OFFLINE_TIMEOUT_MS, 10)
  : 30000; // default 30s

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // user comes online (sent from client after login or reconnect)
    socket.on("user_online", async (userId) => {
      try {
        if (!userId) return;

        // add socket id to set
        if (!onlineUsers[userId]) onlineUsers[userId] = new Set();
        onlineUsers[userId].add(socket.id);

        // clear pending offline timeout if any
        if (disconnectTimeouts[userId]) {
          clearTimeout(disconnectTimeouts[userId]);
          delete disconnectTimeouts[userId];
        }

        // update DB isOnline true
        await User.findByIdAndUpdate(userId, { isOnline: true }, { new: true });

        // broadcast presence update to clients
        io.emit("user_status", { userId, isOnline: true });
        io.emit("online_users", Object.keys(onlineUsers));

        // deliver undelivered messages (existing behavior)
        const undeliveredMessages = await Message.find({
          receiverId: userId,
          status: "sent",
        });

        if (undeliveredMessages.length > 0) {
          await Message.updateMany(
            { receiverId: userId, status: "sent" },
            { status: "delivered" },
          );

          const senderIds = [
            ...new Set(undeliveredMessages.map((m) => m.senderId.toString())),
          ];
          senderIds.forEach((senderId) => {
            const senderSockets = onlineUsers[senderId];
            if (senderSockets) {
              // notify all sockets of the sender
              senderSockets.forEach((sid) => {
                io.to(sid).emit("messages_delivered", {
                  receiverId: userId,
                  messageIds: undeliveredMessages
                    .filter((m) => m.senderId.toString() === senderId)
                    .map((m) => m._id),
                });
              });
            }
          });
        }
      } catch (error) {
        console.log("Error in user_online handler:", error);
      }
    });

    

    // user opens a chat — mark messages as seen
    socket.on("messages_seen", async ({ senderId, receiverId }) => {
      try {
        await Message.updateMany(
          { senderId, receiverId, status: { $ne: "seen" } },
          { status: "seen" },
        );

        const senderSockets = onlineUsers[senderId];
        if (senderSockets) {
          senderSockets.forEach((sid) => {
            io.to(sid).emit("messages_seen", { senderId, receiverId });
          });
        }
      } catch (error) {
        console.log("Error updating seen status:", error);
      }
    });

    // handle disconnect: remove this socket from any user's set and
    // if that was the last socket, schedule marking user offline
    socket.on("disconnect", () => {
      try {
        const affectedUserIds = Object.keys(onlineUsers).filter((userId) =>
          onlineUsers[userId].has(socket.id),
        );

        affectedUserIds.forEach((userId) => {
          const sockets = onlineUsers[userId];
          sockets.delete(socket.id);

          if (sockets.size === 0) {
            // schedule offline marking after timeout
            disconnectTimeouts[userId] = setTimeout(async () => {
              try {
                const lastSeen = new Date();
                await User.findByIdAndUpdate(
                  userId,
                  { isOnline: false, lastSeen },
                  { new: true },
                );

                // remove user from online map and clear timeout
                delete onlineUsers[userId];
                delete disconnectTimeouts[userId];

                // broadcast offline status with lastSeen timestamp
                io.emit("user_status", { userId, isOnline: false, lastSeen });
                io.emit("online_users", Object.keys(onlineUsers));
              } catch (err) {
                console.log("Error marking user offline:", err);
              }
            }, OFFLINE_TIMEOUT);
          } else {
            // still has other sockets open for this user
            io.emit("online_users", Object.keys(onlineUsers));
          }
        });
      } catch (error) {
        console.log("Error in disconnect handler:", error);
      }
    });
  });
};

module.exports = { initSocket, onlineUsers };
