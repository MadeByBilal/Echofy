const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth.middleware')
const { sendRequest } = require('../controllers/friend.controller')

router.post('/request', protect, sendRequest)

module.exports = router