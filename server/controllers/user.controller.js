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

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot search yourself' })
    }

    res.status(200).json({ user })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { name, bio, profilePic } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, profilePic },
      { new: true }
    ).select('-password')

    res.status(200).json({ message: 'Profile updated', user })

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const markLastSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const lastSeen = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: false, lastSeen },
      { new: true },
    ).select('-password');

    res.status(200).json({ message: 'Marked lastSeen', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
module.exports = { searchByPhone, updateProfile }