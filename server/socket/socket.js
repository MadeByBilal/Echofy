const Message = require("../models/Message.model");
const User = require("../models/User.model");

const onlineUsers = {};
const disconnectTimeouts = {};

const OFFLINE_TIMEOUT = parseInt(process.env.OFFLINE_TIMEOUT_MS || "30000", 10);

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("user_online", async (userId) => {
      if (!userId) return;

      try {
        if (!onlineUsers[userId]) onlineUsers[userId] = new Set();
        onlineUsers[userId].add(socket.id);

        if (disconnectTimeouts[userId]) {
          clearTimeout(disconnectTimeouts[userId]);
          delete disconnectTimeouts[userId];
        }

        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("user_status", { userId, isOnline: true });
        io.emit("online_users", Object.keys(onlineUsers));

        await deliverPendingMessages(io, userId);
      } catch (err) {
        console.log("user_online error:", err);
      }
    });

    // ─── TYPING INDICATOR ───────────────────────────────────────
    socket.on("typing", ({ receiverId, senderId }) => {
      onlineUsers[receiverId]?.forEach((sid) => {
        io.to(sid).emit("typing", { senderId });
      });
    });

    socket.on("stop_typing", ({ receiverId, senderId }) => {
      onlineUsers[receiverId]?.forEach((sid) => {
        io.to(sid).emit("stop_typing", { senderId });
      });
    });

    // ─── MESSAGE REACTION ───────────────────────────────────────
    socket.on("message_reaction", async ({ messageId, emoji, userId, action }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;

        if (action === "add") {
          const existing = msg.reactions.find(
            (r) => r.userId.toString() === userId && r.emoji === emoji,
          );
          if (!existing) {
            msg.reactions.push({ emoji, userId });
          } else {
            // toggle off if same emoji
            msg.reactions.pull({ _id: existing._id });
          }
        } else {
          msg.reactions.pull({ userId, emoji });
        }

        await msg.save();

        const chatId = msg.groupId?.toString() || msg.senderId?.toString();
        const targetId = msg.groupId?.toString() || msg.receiverId?.toString();

        // notify both ends
        const notifyIds = [msg.senderId?.toString(), msg.receiverId?.toString()];
        notifyIds.forEach((id) => {
          if (id) {
            onlineUsers[id]?.forEach((sid) => {
              io.to(sid).emit("reaction_updated", {
                messageId,
                reactions: msg.reactions,
              });
            });
          }
        });

        // notify group members
        if (msg.groupId) {
          io.emit("reaction_updated", { messageId, reactions: msg.reactions });
        }
      } catch (err) {
        console.log("reaction error:", err);
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

    socket.on("disconnect", () => {
      const userId = Object.keys(onlineUsers).find((id) =>
        onlineUsers[id].has(socket.id),
      );

      if (!userId) return;

      onlineUsers[userId].delete(socket.id);

      if (onlineUsers[userId].size > 0) return;

      delete onlineUsers[userId];
      io.emit("user_status", { userId, isOnline: false });
      io.emit("online_users", Object.keys(onlineUsers));

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
