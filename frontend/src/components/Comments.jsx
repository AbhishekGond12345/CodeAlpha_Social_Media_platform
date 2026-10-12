import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Comments({ postId, onCount }) {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .comments(postId)
      .then((d) => setItems(d.comments))
      .catch((e) => setError(e.message));
  }, [postId]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { comment, commentCount } = await api.addComment(postId, text);
      setItems((c) => [...(c || []), comment]);
      onCount(commentCount);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    try {
      const { commentCount } = await api.deleteComment(postId, c.id);
      setItems((list) => list.filter((x) => x.id !== c.id));
      onCount(commentCount);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="comments">
      {items === null && !error && <p className="muted small">Loading comments…</p>}
      {items?.length === 0 && <p className="muted small">No comments yet. Start the conversation.</p>}
      <ul>
        {items?.map((c) => (
          <li key={c.id} className="comment">
            <Avatar user={c.author} size={28} />
            <div className="comment-body">
              <p>
                <Link to={`/u/${c.author?.username}`} className="name">{c.author?.displayName}</Link>{' '}
                <span className="muted small">@{c.author?.username} · {timeAgo(c.createdAt)}</span>
              </p>
              <p className="comment-text">{c.content}</p>
            </div>
            {c.author?.username === user.username && (
              <button type="button" className="link-btn small" onClick={() => remove(c)} aria-label="Delete comment">Delete</button>
            )}
          </li>
        ))}
      </ul>
      <form className="comment-form" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={240}
          placeholder="Write a comment"
          aria-label="Write a comment"
        />
        <button className="btn btn-solid btn-sm" disabled={busy || !text.trim()}>Reply</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
