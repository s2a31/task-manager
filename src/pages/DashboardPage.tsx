import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Protected route</p>
        <h1>Dashboard</h1>
        <p>
          Welcome, {user?.name ?? 'user'}. This page is available to signed-in
          users.
        </p>

        <div className="button-row">
          {user?.role === 'admin' ? <Link to="/admin">Open admin</Link> : null}
          <button type="button" className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </section>
    </main>
  );
}
