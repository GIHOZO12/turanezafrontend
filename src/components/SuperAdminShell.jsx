import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { logoutSuperAdmin } from '../api/superadmin';

const navLinkClass = ({ isActive }) =>
  clsx(
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
    isActive ? 'bg-primary text-white shadow-card' : 'text-slate-600 hover:bg-slate-100',
  );

const NAV_ITEMS = [
  { to: '/super-admin', end: true, label: 'Dashboard' },
  { to: '/super-admin/payments', label: 'Payment Proofs' },
  { to: '/super-admin/users', label: 'Users' },
  { to: '/super-admin/compliance', label: 'Compliance' },
  { to: '/super-admin/groups', label: 'Groups' },
  { to: '/super-admin/plots', label: 'Plots' },
  { to: '/super-admin/projects', label: 'Projects' },
  { to: '/super-admin/chats', label: 'Chats' },
  { to: '/super-admin/audit-logs', label: 'Audit Logs' },
];

const SuperAdminShell = ({ title, subtitle, actions, children }) => {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutSuperAdmin();
    } catch (err) {
      // ignore
    }
    navigate('/super-admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-porcelain text-slate-900">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <img
            src="/urban_evolution_group_logo.png"
            alt="Urban Evolution Group"
            className="h-9 w-9 rounded-2xl object-contain shadow-card"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Super Admin</p>
            <p className="text-sm font-bold text-slate-900">Urban Evolution</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          className="inline-flex items-center rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/60 hover:text-primary"
        >
          {mobileNavOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {mobileNavOpen ? (
        <nav className="space-y-2 border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClass}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
          >
            Logout
          </button>
        </nav>
      ) : null}

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white px-6 py-8 lg:flex">
          <div className="rounded-3xl bg-primary/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <img
                src="/urban_evolution_group_logo.png"
                alt="Urban Evolution Group"
                className="h-10 w-10 rounded-2xl object-contain shadow-card"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Super Admin</p>
                <p className="text-lg font-bold text-slate-900">Urban Evolution</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Control Center</p>
          </div>
          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 px-5 py-8 md:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{subtitle}</p>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
          </header>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminShell;
