import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isLogin) await login({ email: form.email, password: form.password });
      else await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <p className="brand brand-light"><span className="brand-mark" aria-hidden="true" />Cobble</p>
        <h1>Short posts from the people you follow.</h1>
        <p>Share what's on your mind in 280 characters, reply to friends, and keep a profile that's yours.</p>
      </section>

      <section className="auth-panel">
        <form onSubmit={submit} className="auth-form" noValidate>
          <h2>{isLogin ? 'Log in to Cobble' : 'Create your account'}</h2>

          {!isLogin && (
            <>
              <label>Name
                <input value={form.displayName} onChange={set('displayName')} autoComplete="name" required maxLength={40} />
              </label>
              <label>Username
                <input value={form.username} onChange={set('username')} autoComplete="username" required minLength={3} maxLength={20} placeholder="letters, numbers, underscores" />
              </label>
            </>
          )}
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </label>
          <label>Password
            <input type="password" value={form.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} placeholder={isLogin ? '' : 'At least 8 characters'} />
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-solid btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>

          <p className="muted center">
            {isLogin ? 'New to Cobble? ' : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} className="text-link">{isLogin ? 'Create an account' : 'Log in'}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
