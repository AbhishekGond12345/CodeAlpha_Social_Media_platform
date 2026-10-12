import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const signToken = (userId) => jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
