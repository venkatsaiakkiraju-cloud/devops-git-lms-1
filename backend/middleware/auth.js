// ─────────────────────────────────────────────
//  middleware/auth.js
//  Protects routes — checks JWT token in request headers
//  Usage: add protect or adminOnly to any route
// ─────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify the token and attach user to request
const protect = async (req, res, next) => {
  let token;

  // Token comes in the Authorization header as: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Only allow admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admins only.' });
  }
};

// Allow admin or instructor
const instructorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Instructors or Admins only.' });
  }
};

module.exports = { protect, adminOnly, instructorOrAdmin };
