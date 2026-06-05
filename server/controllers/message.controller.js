const Message = require("../models/Message.model");
const User = require("../models/User.model");
const PushSubscription = require("../models/PushSubscription.model");
const webpush = require("web-push");
const { uploadToCloudinary } = require("../utils/uploadImage");

const sendMessage = async (req, res) => {
  try {
    const { receiverId, groupId, text, replyTo, fileUrl, fileType, fileName, fileSize } = req.body;
    const senderId = req.user._id;

    if (!receiverId && !groupId) {
      return res.status(400).json({ message: "receiverId or groupId is required" });
    }

    if (!text && !fileUrl) {
      return res.status(400).json({ message: "text or fileUrl is required" });
    }

    let message = await Message.create({
      senderId,
      receiverId: receiverId || null,
      groupId: groupId || null,
      text: text || "",
      fileUrl: fileUrl || null,
      fileType: fileType || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      replyTo: replyTo || null,
    });

    message = await message.populate("replyTo", "text senderId");

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const sender = await User.findById(senderId).select("name username profilePic");
    const senderName = sender?.name || sender?.username || "Someone";
    const payload = { ...message.toObject(), senderName };

    // Deliver to specific user
    if (receiverId) {
      const receiverSocketIds = onlineUsers[receiverId];
      if (receiverSocketIds && receiverSocketIds.size > 0) {
        receiverSocketIds.forEach((socketId) => {
          io.to(socketId).emit("receive_message", payload);
        });
        message.status = "delivered";
        await message.save();
      }
    }

    // Deliver to group
    if (groupId) {
      io.emit("receive_message", payload);
      message.status = "delivered";
      await message.save();
    }

    // Push notification
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && receiverId) {
      const body = text || (fileType === "image" ? "Sent an image" : fileUrl ? "Sent a file" : "New message");
      const subscriptions = await PushSubscription.find({ userId: receiverId });
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify({
              title: senderName, body,
              icon: "/favicon.ico",
              data: { senderId: senderId.toString(), url: `/chat/${senderId}` },
            }),
          );
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.findOneAndDelete({ endpoint: sub.endpoint });
          }
        }
      }
    }

    res.status(201).json({ message: payload });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
      isDeleted: false,
    })
      .populate("replyTo", "text senderId")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── EDIT MESSAGE ──────────────────────────────────────────────
const editMessage = async (req, res) => {
  try {
    const { messageId, text } = req.body;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, senderId: userId });
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.text = text;
    message.isEdited = true;
    await message.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const targets = [message.receiverId?.toString(), message.senderId?.toString()];
    targets.forEach((id) => {
      if (id) {
        onlineUsers[id]?.forEach((sid) => {
          io.to(sid).emit("message_edited", { messageId, text, isEdited: true });
        });
      }
    });

    res.status(200).json({ message: "Edited", data: { messageId, text, isEdited: true } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE MESSAGE ────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: messageId, senderId: userId });
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.isDeleted = true;
    message.text = "";
    message.fileUrl = null;
    message.fileName = null;
    message.fileSize = null;
    await message.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    const targets = [message.receiverId?.toString(), message.senderId?.toString()];
    targets.forEach((id) => {
      if (id) {
        onlineUsers[id]?.forEach((sid) => {
          io.to(sid).emit("message_deleted", { messageId });
        });
      }
    });

    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── SEARCH MESSAGES ───────────────────────────────────────────
const searchMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { q } = req.query;

    if (!q) return res.status(400).json({ message: "Search query required" });

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: { $ne: null } },
        { receiverId: myId },
      ],
      text: { $regex: q, $options: "i" },
      isDeleted: false,
    })
      .populate("senderId", "name username profilePic")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const result = await uploadToCloudinary(req.file.buffer, { folder: "echofy/chat-files" });
    res.status(200).json({
      url: result.secure_url,
      fileType: result.resource_type === "image" ? "image" : "file",
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = { sendMessage, getChatHistory, editMessage, deleteMessage, searchMessages, uploadChatFile };
