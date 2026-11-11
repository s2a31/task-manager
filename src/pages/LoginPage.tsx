import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User, UserRole } from '../types';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

function createMockUser(role: UserRole): User {
  return {
    id: role === 'admin' ? 'admin-1' : 'user-1',
    name: role === 'admin' ? 'Admin User' : 'Regular User',
    email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
    role,
    createdAt: new Date(),
  };
}

export function LoginPage() {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as LocationState | null;

  function handleLogin(role: UserRole) {
    const nextUser = createMockUser(role);
    const requestedPath = locationState?.from?.pathname;
    const defaultPath = role === 'admin' ? '/admin' : '/dashboard';
    const destination =
      role === 'user' && requestedPath === '/admin'
        ? '/dashboard'
        : requestedPath ?? defaultPath;

    login(nextUser);
    navigate(destination, { replace: true });
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <p className="eyebrow">Task Manager</p>
        <h1>Mock login</h1>
        <p>
          Choose a role to test protected routes before real authentication is
          added.
        </p>

        {user ? (
          <div className="status-box">
            <strong>Signed in as {user.name}</strong>
            <span>Role: {user.role}</span>
          </div>
        ) : null}

        <div className="button-row">
          <button type="button" onClick={() => handleLogin('user')}>
            Continue as user
          </button>
          <button type="button" onClick={() => handleLogin('admin')}>
            Continue as admin
          </button>
          {user ? (
            <button type="button" className="secondary-button" onClick={logout}>
              Log out
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
