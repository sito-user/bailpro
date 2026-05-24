const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const requireAuth = (req, res, next) => {
  // Accept token from cookie OR Authorization header (for iOS Safari)
  const cookieToken = req.cookies?.token;
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentification requise',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.orgId = decoded.orgId;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token invalide ou expiré',
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentification requise',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Accès non autorisé',
      });
    }
    next();
  };
};

module.exports = { requireAuth, requireRole };