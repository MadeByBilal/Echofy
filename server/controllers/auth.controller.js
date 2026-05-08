const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// REGISTER
const register = async (req, res) => {
  try {
    const { username, password, phone } = req.body;

    if (!username || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      phone,
    });

    // generate token
    const token = generateToken(user._id);

    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true, // JS in browser can't access it — secure
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      sameSite: "strict",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate token
    const token = generateToken(user._id);

    // send token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// INFO OF THE CURRENT USER LOGIN
const getMe = async (req, res) => {
  res.status(200).json({
    user: req.user // this came from the middleware
  })
}
// LOGOUT THE USER
const logout = async (req, res) => {
  res.clearCookie('token')
  res.status(200).json({ message: 'Logged out successfully' })
}

module.exports = { register, login, logout ,getMe }
