import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return secret;
};

const JWT_EXPIRY = process.env.JWT_EXPIRY || '604800'; // 7 days default

export const generateToken = (userId, email) => {
  try {
    const token = jwt.sign(
      {
        sub: userId,
        email: email
      },
      getJwtSecret(),
      {
        expiresIn: parseInt(JWT_EXPIRY)
      }
    );
    return token;
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw { code: 'TOKEN_EXPIRED', message: 'Token has expired' };
    }
    throw { code: 'INVALID_TOKEN', message: 'Invalid token' };
  }
};

export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};
