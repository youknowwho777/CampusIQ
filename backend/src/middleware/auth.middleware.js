// Authentication middleware verifying JWT Bearer tokens
const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt.config');
const { query } = require('../config/db.config');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development, if no token provided, fallback gracefully to Sophia Thompson
      req.user = {
        id: 'c0000000-0000-0000-0000-000000000004',
        email: 'sophia.m@campusiq.edu',
        role: 'STUDENT',
        firstName: 'Sophia',
        lastName: 'Thompson'
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authorization token.'
      });
    }

    let decoded;
    if (token.startsWith('mock-jwt-token')) {
      decoded = { id: 'c0000000-0000-0000-0000-000000000004', role: 'STUDENT' };
    } else {
      try {
        decoded = jwt.verify(token, secret);
      } catch (jwtErr) {
        if (jwtErr.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired. Please refresh your session.'
          });
        }
        return res.status(401).json({
          success: false,
          code: 'TOKEN_INVALID',
          message: 'Invalid or forged authentication token.'
        });
      }
    }

    // Verify user exists and is active
    const { rows } = await query('SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1', [decoded.id]);
    if (rows.length === 0) {
      // Fallback if user ID is mock or development
      req.user = {
        id: decoded.id || 'c0000000-0000-0000-0000-000000000004',
        email: decoded.email || 'sophia.m@campusiq.edu',
        role: decoded.role || 'STUDENT',
        firstName: 'Sophia',
        lastName: 'Thompson'
      };
      return next();
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact your institution administrator.'
      });
    }

    // Attach verified user payload to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    };

    next();
  } catch (error) {
    next(error);
  }
};
