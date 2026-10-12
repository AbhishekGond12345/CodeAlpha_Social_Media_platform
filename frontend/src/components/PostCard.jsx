import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';
import Comments from './Comments.jsx';

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.4 4.8 6.6 4.6c1.9-.1 3.6.9 5.4 3 1.8-2.1 3.5-3.1 5.4-3 3.2.2 5.1 3.4 3.9 6.7-1.8 4.6-9.3 9.2-9.3 9.2z" />
  </svg>
);
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z" />
  </svg>
);

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [open, setOpen] = useState(false);
  const mine = post.author?.username === user.username;

  async function toggleLike() {
    // optimistic update, rolled back if the request fails
    setLiked(!liked);
    setLikeCount((n) => n + (liked ? -1 : 1));
    try {
      const res = await api.likePost(post.id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked(liked);
      setLikeCount((n) => n + (liked ? 1 : -1));
    }
  }

  async function remove() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    await api.deletePost(post.id);
    onDelete(post.id);
  }

  return (
    <article className="post">
      <Avatar user={post.author} size={44} />
      <div className="post-main">
        <header className="post-head">
          <Link to={`/u/${post.author?.username}`} className="name">{post.author?.displayName}</Link>
          <span className="muted">@{post.author?.username}</span>
          <span className="muted" aria-hidden="true">·</span>
          <time className="muted" dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
          {mine && <button type="button" className="link-btn small push" onClick={remove}>Delete</button>}
        </header>
        {post.content && <p className="post-text">{post.content}</p>}
        {post.media && (
          <div className="media">
            {post.media.type === 'video' ? (
              <video src={post.media.url} controls playsInline preload="metadata" />
            ) : (
              <img src={post.media.url} alt={`Photo posted by ${post.author?.displayName}`} loading="lazy" />
            )}
          </div>
        )}
        <div className="post-actions">
          <button type="button" className={`action ${liked ? 'is-liked' : ''}`} onClick={toggleLike} aria-pressed={liked}>
            <HeartIcon filled={liked} /> <span>{likeCount}</span>
            <span className="sr-only">{liked ? 'Unlike' : 'Like'}</span>
          </button>
          <button type="button" className="action" onClick={() => setOpen(!open)} aria-expanded={open}>
            <ChatIcon /> <span>{commentCount}</span>
            <span className="sr-only">Comments</span>
          </button>
        </div>
        {open && <Comments postId={post.id} onCount={setCommentCount} />}
      </div>
    </article>
  );
}
