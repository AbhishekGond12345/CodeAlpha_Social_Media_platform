import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/http.js';

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, env.JWT_SECRET);
    return await User.findById(sub);
  } catch {
    return null;
  }
}

/** Rejects the request unless a valid session token is sent. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  req.user = user;
  next();
});

/** Attaches req.user when a valid token is present, otherwise continues anonymously. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await resolveUser(req);
  next();
});
