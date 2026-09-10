"use client";

export default function Navbar() {
  return (
    <header className="navbar">
      <h1>Dashboard</h1>

      

      <div className="navbar-right">
        <button
          type="button"
          className="navbar-bell"
          aria-label="Notificações"
          title="Visual — notificações ainda não implementadas"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.1-1.6-5.6-4.5-6.3V4c0-.8-.7-1.5-1.5-1.5S10.5 3.2 10.5 4v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z"
            />
          </svg>
        </button>

        <div className="navbar-user">
          <div className="navbar-avatar" aria-hidden="true">
            U
          </div>
          <div className="navbar-user-meta">
            <span className="navbar-user-name">Usuário</span>
            <span className="navbar-user-email">conta local</span>
          </div>
          <span className="navbar-user-caret" aria-hidden="true">
            ▾
          </span>
        </div>
      </div>
    </header>
  );
}
