import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Follow from '../models/Follow.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { publicPost, publicComment } from '../utils/serialize.js';

const router = Router();
const AUTHOR_FIELDS = 'username displayName bio avatarUrl createdAt';

const postSchema = z.object({
  content: z.string().trim().max(280, 'Posts can be up to 280 characters.').default(''),
});

const MEDIA_TYPES = {
  'image/jpeg': { kind: 'image', ext: 'jpg' },
  'image/png': { kind: 'image', ext: 'png' },
  'image/webp': { kind: 'image', ext: 'webp' },
  'image/gif': { kind: 'image', ext: 'gif' },
  'video/mp4': { kind: 'video', ext: 'mp4' },
  'video/webm': { kind: 'video', ext: 'webm' },
  'video/quicktime': { kind: 'video', ext: 'mov' },
};
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO, files: 1 },
  fileFilter: (_req, file, cb) =>
    MEDIA_TYPES[file.mimetype]
      ? cb(null, true)
      : cb(new HttpError(415, 'Use a JPG, PNG, WebP or GIF photo, or an MP4, WebM or MOV video.')),
});

const bucket = () => supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET);
const commentSchema = z.object({
  content: z.string().trim().min(1, 'Write a comment first.').max(240, 'Comments can be up to 240 characters.'),
});

/** Feed. scope=following → people you follow + you; scope=all → everyone. */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const filter = {};

    if (req.query.scope === 'following') {
      if (!req.user) throw new HttpError(401, 'Log in to see posts from people you follow.');
      const ids = await Follow.find({ follower: req.user._id }).distinct('following');
      filter.author = { $in: [...ids, req.user._id] };
    }
    if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(limit).populate('author', AUTHOR_FIELDS);

    res.json({
      posts: posts.map((p) => publicPost(p, req.user?._id)),
      nextCursor: posts.length === limit ? posts[posts.length - 1].createdAt : null,
    });
  })
);

router.post(
  '/',
  requireAuth,
  upload.single('media'),
  asyncHandler(async (req, res) => {
    const { content } = postSchema.parse(req.body);
    const file = req.file;
    if (!content && !file) throw new HttpError(400, 'Write something or attach a photo or video.');

    let media;
    if (file) {
      const { kind, ext } = MEDIA_TYPES[file.mimetype];
      if (kind === 'image' && file.size > MAX_IMAGE) throw new HttpError(413, 'Photos can be up to 5 MB.');

      const path = `${req.user._id}/${randomUUID()}.${ext}`;
      const { error } = await bucket().upload(path, file.buffer, { contentType: file.mimetype, cacheControl: '31536000' });
      if (error) throw new HttpError(500, `Could not upload your file: ${error.message}`);

      media = { url: bucket().getPublicUrl(path).data.publicUrl, type: kind, path };
    }

    const post = await Post.create({ author: req.user._id, content, media });
    await post.populate('author', AUTHOR_FIELDS);
    res.status(201).json({ post: publicPost(post, req.user._id) });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) throw new HttpError(404, 'This post no longer exists.');
    if (String(post.author) !== String(req.user._id)) throw new HttpError(403, 'You can only delete your own posts.');
    await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
    if (post.media?.path) await bucket().remove([post.media.path]).catch(() => {});
    res.json({ ok: true });
  })
);

/** Toggle like. */
router.post(
  '/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await Post.exists({ _id: req.params.id });
    if (!existing) throw new HttpError(404, 'This post no longer exists.');

    const alreadyLiked = await Post.exists({ _id: req.params.id, likes: req.user._id });
    const update = alreadyLiked ? { $pull: { likes: req.user._id } } : { $addToSet: { likes: req.user._id } };
    const post = await Post.findByIdAndUpdate(req.params.id, update, { new: true });

    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  })
);

router.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('author', AUTHOR_FIELDS);
    res.json({ comments: comments.map(publicComment) });
  })
);

router.post(
  '/:id/comments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { content } = commentSchema.parse(req.body);
    const post = await Post.findById(req.params.id);
    if (!post) throw new HttpError(404, 'This post no longer exists.');

    const comment = await Comment.create({ post: post._id, author: req.user._id, content });
    await Post.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
    await comment.populate('author', AUTHOR_FIELDS);

    res.status(201).json({ comment: publicComment(comment), commentCount: post.commentCount + 1 });
  })
);

router.delete(
  '/:id/comments/:commentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const comment = await Comment.findOne({ _id: req.params.commentId, post: req.params.id });
    if (!comment) throw new HttpError(404, 'This comment no longer exists.');
    if (String(comment.author) !== String(req.user._id)) throw new HttpError(403, 'You can only delete your own comments.');

    await comment.deleteOne();
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: -1 } }, { new: true });
    res.json({ ok: true, commentCount: Math.max(post?.commentCount ?? 0, 0) });
  })
);

export default router;
