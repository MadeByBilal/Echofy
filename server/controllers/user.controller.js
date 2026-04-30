const User = require('../models/User.model')

const searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' })
    }
    const user = await User.findOne({ phone }).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // don't return yourself in search
    if (user._id.toString() === req.user._id.toString()) {// result_id === search_id from frontend.
      return res.status(400).json({ message: 'You cannot search yourself' })
    }

    res.status(200).json({ user })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { searchByPhone }