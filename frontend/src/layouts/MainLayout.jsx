import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--cx-border)] bg-[var(--cx-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80">
            Calori<span className="text-primary-400">X</span>
          </Link>

          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-colors hover:text-primary-400"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-colors hover:text-primary-400"
                >
                  Profile
                </Link>
                <Link
                  to="/meals"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-colors hover:text-primary-400"
                >
                  Meals
                </Link>
                <Link
                  to="/ai-assistant"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-colors hover:text-primary-400 flex items-center gap-1.5"
                >
                  <span>🤖</span> AI Assistant
                </Link>
                <div className="mx-1 h-5 w-px bg-[var(--cx-border)]" />
                <span className="hidden text-sm text-[var(--cx-text-muted)] sm:inline">
                  {user?.username}
                </span>
                <button
                  id="nav-logout"
                  onClick={handleLogout}
                  className="rounded-lg border border-[var(--cx-border)] px-3 py-1.5 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:border-red-500/40 hover:text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-colors hover:text-primary-400"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="cx-btn-primary !px-4 !py-2 text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--cx-border)] py-6 text-center text-sm text-[var(--cx-text-muted)]">
        © {new Date().getFullYear()} CaloriX. All rights reserved.
      </footer>
    </div>
  );
}
