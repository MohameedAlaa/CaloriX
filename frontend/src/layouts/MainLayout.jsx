import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  User,
  UtensilsCrossed,
  Sparkles,
  LogOut,
} from "lucide-react";

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--cx-border)] bg-[var(--cx-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            Calori<span className="text-primary-400">X</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:bg-[var(--cx-surface-elevated)] hover:text-primary-400"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:bg-[var(--cx-surface-elevated)] hover:text-primary-400"
                >
                  <User size={16} />
                  Profile
                </Link>

                <Link
                  to="/meals"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:bg-[var(--cx-surface-elevated)] hover:text-primary-400"
                >
                  <UtensilsCrossed size={16} />
                  Meals
                </Link>

                <Link
                  to="/ai-assistant"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:bg-[var(--cx-surface-elevated)] hover:text-primary-400"
                >
                  <Sparkles size={16} />
                  AI Assistant
                </Link>

                <div className="mx-1 h-5 w-px bg-[var(--cx-border)]" />

                {/* Username */}
                <span className="hidden items-center gap-2 text-sm text-[var(--cx-text-muted)] sm:flex">
                  <User size={14} />
                  {user?.username}
                </span>

                {/* Logout */}
                <button
                  id="nav-logout"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--cx-border)] px-3 py-1.5 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--cx-text-muted)] transition-all hover:bg-[var(--cx-surface-elevated)] hover:text-primary-400"
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

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--cx-border)] py-6 text-center text-sm text-[var(--cx-text-muted)]">
        © {new Date().getFullYear()} CaloriX. All rights reserved.
      </footer>
    </div>
  );
}