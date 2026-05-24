const Message = require("../models/Message.model");
const FriendRequest = require("../models/FriendRequest.model");

const sendRequest = async (req, res) => {
  try {
    const { to } = req.body; // this is the userId of other person
    const from = req.user._id; // current logged in user  came from middleware

    // can't send request to yourself
    if (from.toString() === to) {
      return res
        .status(400)
        .json({ message: "Cannot send request to yourself" });
    }

    // check if request already exists
    const existing = await FriendRequest.findOne({ from, to });
    if (existing) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // check if they already sent you a request
    const reverseRequest = await FriendRequest.findOne({ from: to, to: from });
    if (reverseRequest) {
      return res
        .status(400)
        .json({ message: "This user already sent you a request" });
    }

    // create the request
    const request = await FriendRequest.create({ from, to });

    // emit real-time notification to recipient if they are online
    try {
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers");
      if (io && onlineUsers) {
        const sockets = onlineUsers[to];
        if (sockets && sockets.size) {
          Array.from(sockets).forEach((sid) => {
            io.to(sid).emit("friend_request", { request });
          });
        }
      }
    } catch (err) {
      console.log("emit friend_request error:", err);
    }

    res.status(201).json({
      message: "Friend request sent",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Respond to request
const respondToRequest = async (req, res) => {
  try {
    // get request ID and action from body
    const { requestId, action } = req.body;
    // action = 'accepted' or 'rejected'

    //find the request in DB
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // only the receiver can respond
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    //can't respond to already handled request
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already responded to" });
    }

    //update status
    request.status = action;
    await request.save();

    res.status(200).json({
      message: `Request ${action}`,
      request,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.user._id,
      status: "pending",
    }).populate("from", "username phone profilePic");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    // find all accepted requests where I am either sender or receiver
    const requests = await FriendRequest.find({
      status: "accepted",
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("from", "username name bio phone profilePic isOnline lastSeen")
      .populate("to", "username name bio phone profilePic isOnline lastSeen");

    // extract the friend from each request
    const friendUsers = requests.map((request) => {
      if (request.from._id.toString() === userId.toString()) {
        return request.to;
      } else {
        return request.from;
      }
    });

    const friends = await Promise.all(
      friendUsers.map(async (friend) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: friend._id },
            { senderId: friend._id, receiverId: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .select("text createdAt status senderId");

        return {
          ...friend.toObject(),
          lastMessage,
        };
      }),
    );

    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  sendRequest,
  respondToRequest,
  getIncomingRequests,
  getFriends,
};
