const Message = require("../models/Message.model");
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

    if (receiverSocketIds && receiverSocketIds.size > 0) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("receive_message", message);
      });

      message.status = "delivered";
      await message.save();
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
