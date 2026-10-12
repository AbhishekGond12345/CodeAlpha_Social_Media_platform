import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';

const MAX = 280;
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 25 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime';

const PhotoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="M21 16l-5-5-8 8" />
  </svg>
);

export default function Composer({ onCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const left = MAX - text.length;
  const isVideo = file?.type.startsWith('video');

  useEffect(() => {
    if (!file) return setPreview('');
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    const video = f.type.startsWith('video');
    if (!ACCEPT.split(',').includes(f.type)) return setError('Use a JPG, PNG, WebP or GIF photo, or an MP4, WebM or MOV video.');
    if (video && f.size > MAX_VIDEO) return setError('Videos can be up to 25 MB.');
    if (!video && f.size > MAX_IMAGE) return setError('Photos can be up to 5 MB.');
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setBusy(true);
    setError('');
    try {
      const { post } = await api.createPost(text, file);
      onCreated(post);
      setText('');
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <Avatar user={user} size={44} />
      <div className="composer-main">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX}
          rows={3}
          placeholder="What's on your mind?"
          aria-label="Write a post"
        />

        {preview && (
          <div className="attach-preview">
            {isVideo ? <video src={preview} controls playsInline /> : <img src={preview} alt="Selected photo preview" />}
            <button type="button" className="attach-remove" onClick={() => setFile(null)} aria-label="Remove attachment">×</button>
          </div>
        )}

        <div className="composer-foot">
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={pick} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <button type="button" className="icon-btn" onClick={() => inputRef.current?.click()} disabled={busy} aria-label="Add photo or video" title="Add photo or video">
            <PhotoIcon />
            <span>Photo / video</span>
          </button>
          <span className={`counter push ${left < 20 ? 'is-low' : ''}`} aria-live="polite">{left}</span>
          <button className="btn btn-solid" disabled={busy || (!text.trim() && !file)}>
            {busy ? (file ? 'Uploading…' : 'Posting…') : 'Post'}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </form>
  );
}
