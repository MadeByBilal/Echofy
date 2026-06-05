const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const { upload, handleMulterError } = require("../utils/uploadImage");
const { searchByPhone, updateProfile, uploadImage } = require("../controllers/user.controller");

router.get("/search", protect, searchByPhone);
router.patch("/setup", protect, updateProfile);
router.post("/upload", protect, upload.single("image"), handleMulterError, uploadImage);

module.exports = router;
