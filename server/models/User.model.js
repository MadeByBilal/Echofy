const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, // no two users same username
      trim: true, // removes extra spaces
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "", // will store Cloudinary URL later
    },
    phone: {
      type: String,
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
); // auto adds createdAt and updatedAt

const User = mongoose.model("User", userSchema);

module.exports = User;
