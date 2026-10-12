import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Shell from './components/Shell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
      <Route element={<Private><Shell /></Private>}>
        <Route path="/" element={<Home />} />
        <Route path="/u/:username" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
