const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth.middleware')
const { sendRequest, respondToRequest, getIncomingRequests, getFriends } = require('../controllers/friend.controller')

router.post('/request', protect, sendRequest)
router.patch('/respond', protect, respondToRequest)
router.get('/requests', protect, getIncomingRequests)
router.get('/', protect, getFriends)

module.exports = router
