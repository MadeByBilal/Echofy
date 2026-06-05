const Group = require("../models/Group.model");
const Message = require("../models/Message.model");
const User = require("../models/User.model");

// CREATE GROUP
const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const creatorId = req.user._id;

    if (!name) return res.status(400).json({ message: "Group name is required" });

    const memberSet = new Set([creatorId.toString(), ...(memberIds || [])]);
    const members = Array.from(memberSet).map((id) => ({
      user: id,
      role: id === creatorId.toString() ? "admin" : "member",
    }));

    const group = await Group.create({ name, description, createdBy: creatorId, members });
    const populated = await Group.findById(group._id).populate("members.user", "name username profilePic");

    res.status(201).json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET MY GROUPS
const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ "members.user": userId })
      .populate("members.user", "name username profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET GROUP BY ID
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members.user", "name username profilePic isOnline lastSeen");

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ADD MEMBER
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === "admin",
    );
    if (!isAdmin) return res.status(403).json({ message: "Only admins can add members" });

    const exists = group.members.some((m) => m.user.toString() === userId);
    if (exists) return res.status(400).json({ message: "Already a member" });

    group.members.push({ user: userId, role: "member" });
    await group.save();

    const populated = await Group.findById(group._id).populate("members.user", "name username profilePic");
    res.status(200).json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// REMOVE MEMBER
const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === "admin",
    );
    if (!isAdmin) return res.status(403).json({ message: "Only admins can remove members" });

    group.members = group.members.filter((m) => m.user.toString() !== userId);
    await group.save();

    const populated = await Group.findById(group._id).populate("members.user", "name username profilePic");
    res.status(200).json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE GROUP INFO
const updateGroup = async (req, res) => {
  try {
    const { name, description, profilePic } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isAdmin = group.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === "admin",
    );
    if (!isAdmin) return res.status(403).json({ message: "Only admins can update group" });

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (profilePic !== undefined) group.profilePic = profilePic;
    await group.save();

    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET GROUP MESSAGES
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId, isDeleted: false })
      .populate("senderId", "name username profilePic")
      .populate("replyTo", "text senderId")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createGroup, getMyGroups, getGroupById, addMember, removeMember, updateGroup, getGroupMessages };
