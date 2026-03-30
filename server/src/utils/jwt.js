const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret || !secret.trim()) {
  throw new Error('Missing JWT_SECRET environment variable');
}

function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

function verifyToken(token) {
  return jwt.verify(token, secret);
}

module.exports = {
  signToken,
  verifyToken,
};
