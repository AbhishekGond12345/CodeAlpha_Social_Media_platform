export const publicUser = (u) => ({
  id: String(u._id),
  username: u.username,
  displayName: u.displayName,
  bio: u.bio || '',
  avatarUrl: u.avatarUrl || '',
  createdAt: u.createdAt,
});

export const publicPost = (p, viewerId) => ({
  id: String(p._id),
  content: p.content,
  media: p.media?.url ? { url: p.media.url, type: p.media.type } : null,
  createdAt: p.createdAt,
  author: p.author && p.author.username ? publicUser(p.author) : null,
  likeCount: p.likes.length,
  liked: viewerId ? p.likes.some((id) => String(id) === String(viewerId)) : false,
  commentCount: p.commentCount,
});

export const publicComment = (c) => ({
  id: String(c._id),
  post: String(c.post),
  content: c.content,
  createdAt: c.createdAt,
  author: c.author && c.author.username ? publicUser(c.author) : null,
});
