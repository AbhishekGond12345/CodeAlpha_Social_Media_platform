import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '50kb' }));
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => app.listen(env.PORT, () => console.log(`✔ API running on http://localhost:${env.PORT}`)))
  .catch((err) => {
    console.error('✖ Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
