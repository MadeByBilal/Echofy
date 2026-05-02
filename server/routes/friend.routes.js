const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth.middleware')
const { sendRequest, respondToRequest , getIncomingRequests} = require('../controllers/friend.controller')
router.post('/request' , protect, sendRequest)
router.patch('/respond', protect, respondToRequest) 
router.get('/requests', protect, getIncomingRequests)
module.exports = router