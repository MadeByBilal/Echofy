const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const { subscribe, unsubscribe } = require("../controllers/notification.controller");

router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);

module.exports = router;
