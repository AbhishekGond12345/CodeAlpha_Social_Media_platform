// Demo mode: in-memory sample data so the UI works with no backend.
// Enabled by VITE_DEMO_MODE=true in frontend/.env. Data resets on page refresh.

const mins = (m) => new Date(Date.now() - m * 60000).toISOString();
const wait = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120));
const fail = (message) => Promise.reject(new Error(message));

const person = (id, username, displayName, bio) => ({ id, username, displayName, bio, avatarUrl: '', createdAt: mins(60 * 24 * 45) });

const me = person('me', 'demo', 'Demo User', 'Trying out Cobble.');
const others = [
  person('u1', 'asha', 'Asha Verma', 'Photographer. Chasing monsoon light in Lucknow.'),
  person('u2', 'rohan_dev', 'Rohan Mehta', 'Building small tools. Coffee first, code second.'),
  person('u3', 'meera', 'Meera Iyer', 'Reader, runner, occasional poet.'),
  person('u4', 'kabir', 'Kabir Singh', 'Cricket stats and chai.'),
  person('u5', 'tanvi', 'Tanvi Rao', 'Design student. Typography nerd.'),
];
const byId = Object.fromEntries([me, ...others].map((u) => [u.id, u]));
const byName = () => Object.fromEntries(Object.values(byId).map((u) => [u.username, u]));

const following = new Set(['u1', 'u2']);
let seq = 100;

const posts = [
  { id: 'p1', authorId: 'u1', content: 'First rain of the season and the whole street smells like wet earth. Got the best light of the year at 6 pm.', createdAt: mins(14), likes: new Set(['u2', 'me']), media: { type: 'image', url: photo('#3446d4', '#8fa2ff', 'Monsoon evening') } },
  { id: 'p2', authorId: 'u2', content: 'Shipped a tiny CLI today that renames photos by date. It took longer to name than to write.', createdAt: mins(55), likes: new Set(['u1']) },
  { id: 'p3', authorId: 'u3', content: 'Finished 10 km this morning without stopping. Slow, but it was mine.', createdAt: mins(130), likes: new Set() },
  { id: 'p4', authorId: 'u4', content: 'Hot take: a good chai needs ginger first, tea leaves second, patience third.', createdAt: mins(300), likes: new Set(['u3', 'u5', 'u1']), media: { type: 'image', url: photo('#d6884a', '#f3c98b', 'Chai o\'clock') } },
  { id: 'p5', authorId: 'u5', content: 'Spent two hours choosing between two nearly identical fonts. Worth it.', createdAt: mins(60 * 26), likes: new Set(['u2']) },
  { id: 'p6', authorId: 'me', content: 'Hello Cobble! This is my first post.', createdAt: mins(60 * 30), likes: new Set(['u1']) },
];

const comments = [
  { id: 'c1', postId: 'p1', authorId: 'u2', content: 'Send the photos when you edit them!', createdAt: mins(9) },
  { id: 'c2', postId: 'p1', authorId: 'u3', content: 'That smell is the best part of July.', createdAt: mins(6) },
  { id: 'c3', postId: 'p4', authorId: 'u1', content: 'Cardamom too. Non-negotiable.', createdAt: mins(240) },
];

const photo = (a, b, label) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='800' height='500' fill='url(#g)'/><circle cx='620' cy='140' r='70' fill='rgba(255,255,255,.35)'/><path d='M0 400 Q200 300 400 380 T800 340 V500 H0Z' fill='rgba(0,0,0,.18)'/><text x='40' y='460' font-family='sans-serif' font-size='28' fill='white'>${label}</text></svg>`
  )}`;

const viewUser = (u) => ({ id: u.id, username: u.username, displayName: u.displayName, bio: u.bio, avatarUrl: u.avatarUrl, createdAt: u.createdAt });
const viewPost = (p) => ({
  id: p.id,
  content: p.content,
  media: p.media || null,
  createdAt: p.createdAt,
  author: viewUser(byId[p.authorId]),
  likeCount: p.likes.size,
  liked: p.likes.has('me'),
  commentCount: comments.filter((c) => c.postId === p.id).length,
});
const viewComment = (c) => ({ id: c.id, post: c.postId, content: c.content, createdAt: c.createdAt, author: viewUser(byId[c.authorId]) });
const sorted = (list) => [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export const mockApi = {
  register: (b) => {
    Object.assign(me, { username: b.username || 'demo', displayName: b.displayName || 'Demo User', email: b.email });
    return wait({ token: 'demo', user: viewUser(me) });
  },
  login: () => wait({ token: 'demo', user: viewUser(me) }),
  me: () => wait({ user: viewUser(me) }),

  feed: (scope) => {
    const list = scope === 'following' ? posts.filter((p) => p.authorId === 'me' || following.has(p.authorId)) : posts;
    return wait({ posts: sorted(list).map(viewPost), nextCursor: null });
  },
  createPost: (content, file) => {
    const media = file ? { type: file.type.startsWith('video') ? 'video' : 'image', url: URL.createObjectURL(file) } : null;
    const p = { id: `p${++seq}`, authorId: 'me', content, createdAt: new Date().toISOString(), likes: new Set(), media };
    posts.push(p);
    return wait({ post: viewPost(p) });
  },
  deletePost: (id) => {
    const i = posts.findIndex((p) => p.id === id);
    if (i >= 0) posts.splice(i, 1);
    return wait({ ok: true });
  },
  likePost: (id) => {
    const p = posts.find((x) => x.id === id);
    if (!p) return fail('This post no longer exists.');
    const liked = !p.likes.has('me');
    liked ? p.likes.add('me') : p.likes.delete('me');
    return wait({ liked, likeCount: p.likes.size });
  },
  comments: (id) => wait({ comments: comments.filter((c) => c.postId === id).map(viewComment) }),
  addComment: (id, content) => {
    const c = { id: `c${++seq}`, postId: id, authorId: 'me', content, createdAt: new Date().toISOString() };
    comments.push(c);
    return wait({ comment: viewComment(c), commentCount: comments.filter((x) => x.postId === id).length });
  },
  deleteComment: (id, cid) => {
    const i = comments.findIndex((c) => c.id === cid);
    if (i >= 0) comments.splice(i, 1);
    return wait({ ok: true, commentCount: comments.filter((x) => x.postId === id).length });
  },

  profile: (username) => {
    const u = byName()[username];
    if (!u) return fail('No one here by that username.');
    const followers = u.id === 'me' ? 3 : 2 + (following.has(u.id) ? 1 : 0);
    return wait({
      user: viewUser(u),
      stats: { followers, following: u.id === 'me' ? following.size : 2, posts: posts.filter((p) => p.authorId === u.id).length },
      isFollowing: following.has(u.id),
      isMe: u.id === 'me',
    });
  },
  userPosts: (username) => {
    const u = byName()[username];
    if (!u) return fail('No one here by that username.');
    return wait({ posts: sorted(posts.filter((p) => p.authorId === u.id)).map(viewPost), nextCursor: null });
  },
  follow: (username) => {
    const u = byName()[username];
    if (!u || u.id === 'me') return fail('You cannot follow yourself.');
    const now = !following.has(u.id);
    now ? following.add(u.id) : following.delete(u.id);
    return wait({ following: now, followers: 2 + (now ? 1 : 0) });
  },
  suggestions: () => wait({ users: others.filter((u) => !following.has(u.id)).slice(0, 5).map(viewUser) }),
  updateProfile: (b) => {
    Object.assign(me, { displayName: b.displayName, bio: b.bio, avatarUrl: b.avatarUrl });
    return wait({ user: viewUser(me) });
  },
};
