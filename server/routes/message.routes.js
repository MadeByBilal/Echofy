const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth.middleware')
const { sendMessage, getChatHistory } = require('../controllers/message.controller')

router.post('/send', protect, sendMessage)
router.get('/:userId', protect, getChatHistory)

module.exports = router