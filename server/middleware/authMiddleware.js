const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  let token = null;

  // 1. Check Authorization Bearer Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // 2. Fallback check for Query Parameter ?token= (used for browser <img>, <video>, and <iframe> media streaming)
  else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing or malformed.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campus_guard_super_secret_jwt_key_2026_secure');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
}

module.exports = authMiddleware;
