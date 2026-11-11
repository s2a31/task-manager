import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Admin route</p>
        <h1>Admin</h1>
        <p>
          Signed in as {user?.name ?? 'admin'}. Only users with the admin role
          can view this page.
        </p>

        <div className="button-row">
          <Link to="/dashboard">Back to dashboard</Link>
          <button type="button" className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </section>
    </main>
  );
}
