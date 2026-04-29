const jwt = require('jsonwebtoken')
const User = require('../models/User.model')

const protect = async (req, res, next) => {
  try {
  
    const token = req.cookies.token // extract token from the cookie like from frontend
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token'}) // token authorization
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) // verify token is real and not expired
    const user = await User.findById(decoded.userId).select('-password') // finding user-object by its token but excluting the password  even if the  password is encrypted but still we dont want that its comings on our frontend. 
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user  //attach user to request so routes can use it

    next() // continue now you  can go to routes

  } catch (error) {
    res.status(401).json({ message: 'Not authorized, invalid token' })
  }
}

module.exports = protect  