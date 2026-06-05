const PushSubscription = require("../models/PushSubscription.model");
const webpush = require("web-push");

const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.user._id;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    await PushSubscription.findOneAndUpdate(
      { userId, endpoint },
      { userId, endpoint, keys },
      { upsert: true, new: true },
    );

    res.status(200).json({ message: "Subscribed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user._id;

    await PushSubscription.findOneAndDelete({ userId, endpoint });
    res.status(200).json({ message: "Unsubscribed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { subscribe, unsubscribe };
