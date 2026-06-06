const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

const COUNTRIES = {
  AF: { length: 10, startsWith: ["07"] },
  DZ: { length: 10, startsWith: ["05", "06", "07"] },
  AR: { length: 13, startsWith: ["15"] },
  BD: { length: 11, startsWith: ["01"] },
  BR: { length: 11, startsWith: [] },
  CA: { length: 11, startsWith: ["1"] },
  CN: { length: 11, startsWith: ["1"] },
  CO: { length: 10, startsWith: ["3"] },
  CD: { length: 10, startsWith: ["08", "09"] },
  EG: { length: 11, startsWith: ["010", "011", "012", "015"] },
  ET: { length: 10, startsWith: ["09", "07"] },
  FR: { length: 10, startsWith: ["06", "07"] },
  DE: { length: 11, startsWith: ["015", "016", "017"] },
  IN: { length: 10, startsWith: ["6", "7", "8", "9"] },
  ID: { length: 11, startsWith: ["08"] },
  IR: { length: 11, startsWith: ["09"] },
  IQ: { length: 11, startsWith: ["07"] },
  IT: { length: 10, startsWith: ["3"] },
  JP: { length: 11, startsWith: ["070", "080", "090"] },
  KE: { length: 10, startsWith: ["07", "01"] },
  MX: { length: 10, startsWith: [] },
  MM: { length: 9, startsWith: ["09"] },
  MA: { length: 10, startsWith: ["06", "07"] },
  NG: { length: 11, startsWith: ["07", "08", "09"] },
  PK: { length: 11, startsWith: ["03"] },
  PH: { length: 11, startsWith: ["09"] },
  PL: { length: 9, startsWith: [] },
  RU: { length: 11, startsWith: ["8"] },
  SA: { length: 10, startsWith: ["05"] },
  ZA: { length: 10, startsWith: ["06", "07", "08"] },
  KR: { length: 11, startsWith: ["010"] },
  ES: { length: 9, startsWith: ["6", "7"] },
  SD: { length: 10, startsWith: ["09", "01"] },
  TZ: { length: 10, startsWith: ["06", "07"] },
  TH: { length: 10, startsWith: ["06", "08", "09"] },
  TR: { length: 11, startsWith: ["05"] },
  UG: { length: 10, startsWith: ["07"] },
  GB: { length: 11, startsWith: ["07"] },
  US: { length: 11, startsWith: ["1"] },
  VN: { length: 10, startsWith: ["03", "05", "07", "08", "09"] },
};

function validatePhoneByCountry(phone, countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country) return "Invalid country code";

  const digits = phone.replace(/\D/g, "");
  if (digits.length !== country.length) {
    return `Phone must be ${country.length} digits for this country`;
  }
  if (country.startsWith.length > 0) {
    const valid = country.startsWith.some((s) => digits.startsWith(s));
    if (!valid) {
      return `Phone must start with ${country.startsWith.join(", ")} for this country`;
    }
  }
  return null;
}

const register = async (req, res) => {
  try {
    const { username, password, phone, country } = req.body;

    if (!username || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const digitsOnly = phone.replace(/\D/g, "");

    if (country) {
      const validationError = validatePhoneByCountry(digitsOnly, country);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    } else {
      if (digitsOnly.length < 5) {
        return res.status(400).json({ message: "Phone number is invalid" });
      }
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      phone: digitsOnly,
      country: country || "",
    });

    const token = generateToken(user._id);

    const cookieOptions = {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        country: user.country,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    let { username, password, loginType } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user;

    if (loginType === "phone") {
      const digits = username.replace(/\D/g, "");
      user = await User.findOne({ phone: digits });
    } else {
      user = await User.findOne({ username: username.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    const cookieOptions = {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("token", token, cookieOptions);
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        country: user.country,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};

const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login, logout, getMe };
