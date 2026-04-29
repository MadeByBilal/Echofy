const mongoose = require('mongoose')

const friendRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,  // Stores user object || we can access it later.
    ref: 'User',                           
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],  // only these values are allowed!
    default: 'pending'
  }
}, { timestamps: true })

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema)

module.exports = FriendRequest