import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';
import { supabaseAdmin } from '../config/supabase.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { publicUser, publicPost } from '../utils/serialize.js';

const router = Router();

const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name.').max(40, 'Name is too long.'),
  bio: z.string().trim().max(160, 'Bio can be up to 160 characters.').default(''),
  avatarUrl: z.union([z.literal(''), z.string().trim().url('Avatar must be a valid URL.')]).default(''),
});

async function findByUsername(username) {
  const user = await User.findOne({ username: String(username).toLowerCase() });
  if (!user) throw new HttpError(404, 'No one here by that username.');
  return user;
}

/** People the viewer does not follow yet. */
router.get(
  '/suggestions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const followingIds = await Follow.find({ follower: req.user._id }).distinct('following');
    const users = await User.find({ _id: { $nin: [...followingIds, req.user._id] } })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ users: users.map(publicUser) });
  })
);

/** Update own profile — written to MongoDB and mirrored to the Supabase profiles table. */
router.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    Object.assign(req.user, data);
    await req.user.save();

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        display_name: data.displayName,
        bio: data.bio,
        avatar_url: data.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.supabaseId);
    if (error) console.error('Supabase profile sync failed:', error.message);

    res.json({ user: publicUser(req.user) });
  })
);

router.get(
  '/:username',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await findByUsername(req.params.username);
    const [followers, following, posts, isFollowing] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Post.countDocuments({ author: user._id }),
      req.user ? Follow.exists({ follower: req.user._id, following: user._id }) : null,
    ]);
    res.json({
      user: publicUser(user),
      stats: { followers, following, posts },
      isFollowing: Boolean(isFollowing),
      isMe: req.user ? String(req.user._id) === String(user._id) : false,
    });
  })
);

router.get(
  '/:username/posts',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await findByUsername(req.params.username);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const filter = { author: user._id };
    if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'username displayName bio avatarUrl createdAt');

    res.json({
      posts: posts.map((p) => publicPost(p, req.user?._id)),
      nextCursor: posts.length === limit ? posts[posts.length - 1].createdAt : null,
    });
  })
);

/** Toggle follow / unfollow. */
router.post(
  '/:username/follow',
  requireAuth,
  asyncHandler(async (req, res) => {
    const target = await findByUsername(req.params.username);
    if (String(target._id) === String(req.user._id)) throw new HttpError(400, 'You cannot follow yourself.');

    const existing = await Follow.findOneAndDelete({ follower: req.user._id, following: target._id });
    if (!existing) await Follow.create({ follower: req.user._id, following: target._id });

    const followers = await Follow.countDocuments({ following: target._id });
    res.json({ following: !existing, followers });
  })
);

export default router;
