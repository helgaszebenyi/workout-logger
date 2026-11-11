// The white bar at the top: brand on the left, email and Sign out on the right.
export default function TopBar({ email, onSignOut }) {
  return (
    <header className="topbar panel">
      <h1 className="brand">Workout Logger</h1>
      <div className="row">
        <span id="user-email" className="muted small">{email}</span>
        <button type="button" className="btn btn-small" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
