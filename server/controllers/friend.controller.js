const FriendRequest = require('../models/FriendRequest.model')

const sendRequest = async (req, res) => {
  try {

    const { to } = req.body  // this is the userId of other person
    const from = req.user._id // current logged in user  came from middleware

    // can't send request to yourself
    if (from.toString() === to) {
      return res.status(400).json({ message: 'Cannot send request to yourself' })
    }

    // check if request already exists
    const existing = await FriendRequest.findOne({ from, to })
    if (existing) {
      return res.status(400).json({ message: 'Friend request already sent' })
    }

    // check if they already sent you a request
    const reverseRequest = await FriendRequest.findOne({ from: to, to: from })
    if (reverseRequest) {
      return res.status(400).json({ message: 'This user already sent you a request' })
    }

    // create the request
    const request = await FriendRequest.create({ from, to })

    res.status(201).json({
      message: 'Friend request sent',
      request
    })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { sendRequest }