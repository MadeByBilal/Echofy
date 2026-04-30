const express = require('express')
const router = express.Router()
const protect = require('../middleware/auth.middleware')
const { searchByPhone } = require('../controllers/user.controller')

router.get('/search', protect, searchByPhone)  // protected — must be logged in

module.exports = router