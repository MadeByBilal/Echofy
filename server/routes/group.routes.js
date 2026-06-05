const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
  createGroup, getMyGroups, getGroupById,
  addMember, removeMember, updateGroup, getGroupMessages,
} = require("../controllers/group.controller");

router.post("/create", protect, createGroup);
router.get("/my", protect, getMyGroups);
router.get("/:groupId", protect, getGroupById);
router.get("/:groupId/messages", protect, getGroupMessages);
router.post("/:groupId/add", protect, addMember);
router.post("/:groupId/remove", protect, removeMember);
router.patch("/:groupId/update", protect, updateGroup);

module.exports = router;
