const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const { searchByPhone, updateProfile } = require("../controllers/user.controller");

router.get("/search", protect, searchByPhone); // protected — must be logged in
router.patch("/setup", protect, updateProfile);

module.exports = router;
