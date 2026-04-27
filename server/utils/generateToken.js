const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  const token = jwt.sign(
    { userId }, // payload — what we store inside token
    process.env.JWT_SECRET, // secret key to sign it
    { expiresIn: "7d" }, // token expires in 7 days
  );
  return token;
};

module.exports = generateToken;
