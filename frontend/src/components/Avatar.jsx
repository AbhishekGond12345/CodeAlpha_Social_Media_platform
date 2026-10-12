const HUES = [228, 262, 190, 340, 24, 150, 300, 8];

export default function Avatar({ user, size = 40 }) {
  if (!user) return <span className="avatar" style={{ width: size, height: size }} />;
  if (user.avatarUrl) {
    return <img className="avatar" src={user.avatarUrl} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  }
  const hue = HUES[[...user.username].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${hue} 55% 90%)`, color: `hsl(${hue} 55% 28%)` }}
    >
      {user.displayName.trim().charAt(0).toUpperCase()}
    </span>
  );
}
