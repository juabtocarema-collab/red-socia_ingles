import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sena_social_super_secret_jwt_key_2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'aprendiz'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // If not provided, default to user 1 (Juan Pablo Tocarema Ávila - Superadmin)
    req.user = { id: 1, username: 'juanpato27', email: 'juanpablotocaremaavila@gmail.com', role: 'superadmin' };
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback to default user if token invalid
    req.user = { id: 1, username: 'juanpato27', email: 'juanpablotocaremaavila@gmail.com', role: 'superadmin' };
    next();
  }
}
