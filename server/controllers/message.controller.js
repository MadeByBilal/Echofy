const Message = require("../models/Message.model");
const User = require("../models/User.model");
const PushSubscription = require("../models/PushSubscription.model");
const webpush = require("web-push");
const { uploadToCloudinary } = require("../utils/uploadImage");

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, replyTo, fileUrl, fileType, fileName, fileSize } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res
        .status(400)
        .json({ message: "receiverId is required" });
    }

    if (!text && !fileUrl) {
      return res
        .status(400)
        .json({ message: "text or fileUrl is required" });
    }

    let message = await Message.create({
      senderId,
      receiverId,
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

    const receiverSocketIds = onlineUsers[receiverId];

    const sender = await User.findById(senderId).select("name username profilePic");
    const senderName = sender?.name || sender?.username || "Someone";

    if (receiverSocketIds && receiverSocketIds.size > 0) {
      const payload = { ...message.toObject(), senderName };
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("receive_message", payload);
      });

      message.status = "delivered";
      await message.save();
    }

    // ── Send push notification to receiver (if configured) ──
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      const body = text || (fileType === "image" ? "Sent an image" : fileUrl ? "Sent a file" : "New message");
      const subscriptions = await PushSubscription.find({ userId: receiverId });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify({
              title: senderName,
              body,
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

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET CHAT HISTORY
const getChatHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId },
      ],
    })
      .populate("replyTo", "text senderId")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPLOAD CHAT FILE
const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "echofy/chat-files",
    });

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

module.exports = { sendMessage, getChatHistory, uploadChatFile };
