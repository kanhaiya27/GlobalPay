import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      error: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email
    };
    next();
  } catch (error) {
    return res.status(401).json({
      error: error.message || 'Invalid token',
      code: error.code || 'INVALID_TOKEN'
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.errors
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
};
