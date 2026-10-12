import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { supabaseAdmin, newAnonClient } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler, signToken } from '../utils/http.js';
import { publicUser } from '../utils/serialize.js';

const router = Router();

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, 'Username must be 3–20 characters: letters, numbers or underscores.'),
  displayName: z.string().trim().min(1, 'Enter your name.').max(40, 'Name is too long.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72, 'Password is too long.'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

/**
 * Register: the account is written to BOTH stores.
 *  1. Supabase Auth  – credentials (hashed password, email)
 *  2. Supabase `profiles` table – public profile details
 *  3. MongoDB `users` – the document the rest of the app (posts, follows) points to
 * If any step fails, earlier steps are rolled back.
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, displayName, email, password } = registerSchema.parse(req.body);

    const taken = await User.findOne({ $or: [{ username }, { email }] }).select('username email');
    if (taken) {
      throw new HttpError(409, taken.username === username ? 'That username is already taken.' : 'An account with this email already exists.');
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name: displayName },
    });
    if (error) throw new HttpError(error.status === 422 ? 409 : 400, error.message);

    const supabaseId = created.user.id;
    let user;
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({ id: supabaseId, username, display_name: displayName, email });
      if (profileError) throw new HttpError(500, `Could not save profile in Supabase: ${profileError.message}`);

      user = await User.create({ supabaseId, username, email, displayName });
    } catch (err) {
      await supabaseAdmin.from('profiles').delete().eq('id', supabaseId);
      await supabaseAdmin.auth.admin.deleteUser(supabaseId);
      throw err;
    }

    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const { data, error } = await newAnonClient().auth.signInWithPassword({ email, password });
    if (error || !data?.user) throw new HttpError(401, 'Incorrect email or password.');

    let user = await User.findOne({ supabaseId: data.user.id });
    if (!user) {
      // Self-heal: Supabase account exists but the Mongo document is missing.
      const meta = data.user.user_metadata || {};
      user = await User.create({
        supabaseId: data.user.id,
        email,
        username: meta.username || email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 20),
        displayName: meta.display_name || email.split('@')[0],
      });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
