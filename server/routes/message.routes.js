const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth.middleware')
const { upload, handleMulterError } = require('../utils/uploadImage')
const { sendMessage, getChatHistory, uploadChatFile } = require('../controllers/message.controller')

router.post('/send', protect, sendMessage)
router.post('/upload', protect, upload.single('file'), handleMulterError, uploadChatFile)
router.get('/:userId', protect, getChatHistory)

module.exports = router
