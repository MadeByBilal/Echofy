const Message = require("../models/Message.model");
const User = require("../models/User.model");

const onlineUsers = {}; // userId -> Set of socketIds
const disconnectTimeouts = {}; // userId -> timeoutId

const OFFLINE_TIMEOUT = parseInt(process.env.OFFLINE_TIMEOUT_MS || "30000", 10);

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ─── USER COMES ONLINE ───────────────────────────────────────
    socket.on("user_online", async (userId) => {
      if (!userId) return;

      try {
        // track this socket
        if (!onlineUsers[userId]) onlineUsers[userId] = new Set();
        onlineUsers[userId].add(socket.id);

        // cancel any pending offline timeout
        if (disconnectTimeouts[userId]) {
          clearTimeout(disconnectTimeouts[userId]);
          delete disconnectTimeouts[userId];
        }

        // mark online in DB + broadcast
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status", { userId, isOnline: true });
        io.emit("online_users", Object.keys(onlineUsers));

        // deliver any pending messages
        await deliverPendingMessages(io, userId);
      } catch (err) {
        console.log("user_online error:", err);
      }
    });

    // ─── MESSAGES SEEN ───────────────────────────────────────────
    socket.on("messages_seen", async ({ senderId, receiverId }) => {
      try {
        await Message.updateMany(
          { senderId, receiverId, status: { $ne: "seen" } },
          { status: "seen" },
        );

        onlineUsers[senderId]?.forEach((sid) => {
          io.to(sid).emit("messages_seen", { senderId, receiverId });
        });
      } catch (err) {
        console.log("messages_seen error:", err);
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on("disconnect", () => {
      const userId = Object.keys(onlineUsers).find((id) =>
        onlineUsers[id].has(socket.id),
      );

      if (!userId) return;

      onlineUsers[userId].delete(socket.id);

      // still has other tabs open — do nothing
      if (onlineUsers[userId].size > 0) return;

      // last socket closed — remove immediately + broadcast
      delete onlineUsers[userId];
      io.emit("user_status", { userId, isOnline: false });
      io.emit("online_users", Object.keys(onlineUsers));

      // delay DB write in case they reconnect fast
      disconnectTimeouts[userId] = setTimeout(async () => {
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          delete disconnectTimeouts[userId];
        } catch (err) {
          console.log("offline DB update error:", err);
        }
      }, OFFLINE_TIMEOUT);
    });
  });
};

// ─── HELPER ─────────────────────────────────────────────────────
async function deliverPendingMessages(io, userId) {
  const messages = await Message.find({ receiverId: userId, status: "sent" });
  if (!messages.length) return;

  await Message.updateMany(
    { receiverId: userId, status: "sent" },
    { status: "delivered" },
  );

  const bySender = messages.reduce((acc, m) => {
    const id = m.senderId.toString();
    if (!acc[id]) acc[id] = [];
    acc[id].push(m._id);
    return acc;
  }, {});

  Object.entries(bySender).forEach(([senderId, messageIds]) => {
    onlineUsers[senderId]?.forEach((sid) => {
      io.to(sid).emit("messages_delivered", { receiverId: userId, messageIds });
    });
  });
}

module.exports = { initSocket, onlineUsers };
