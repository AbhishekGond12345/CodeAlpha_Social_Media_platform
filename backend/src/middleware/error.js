import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const notFound = (_req, res) => res.status(404).json({ message: 'Route not found.' });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues[0]?.message || 'Invalid input.' });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already taken.` });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'That file is too large. Photos can be up to 5 MB, videos up to 25 MB.' });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ message: 'Could not read the uploaded file.' });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id.' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && env.NODE_ENV === 'production' ? 'Something went wrong on our side.' : err.message,
  });
}
