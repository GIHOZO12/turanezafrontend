import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { fetchCurrentUser, logoutUser } from '../api/users';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Overview', to: '/admin/dashboard' },
  { key: 'users', label: 'Users', to: '/admin/users' },
  { key: 'groups', label: 'Groups', to: '/admin/groups' },
  { key: 'investments', label: 'Investments', to: '/admin/investments' },
  { key: 'compliance', label: 'Compliance', to: '/admin/compliance' },
];

const AdminLayout = ({ active, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [active]);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchCurrentUser();
        if (!mounted) return;
        setUser(response);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load account details.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const isAuthorised = useMemo(() => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'compliance' || user.is_staff || user.is_superuser || user.is_super_admin;
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return 'AD';
    return (user.full_name || user.email || 'AD')
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch (err) {
      // ignore — still send the admin back to login
    } finally {
      setLoggingOut(false);
      navigate('/auth', { replace: true });
    }
  };

  if (!loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-porcelain text-slate-600">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
          <p className="text-base font-semibold text-rose-600">Unable to load admin session</p>
          <p className="mt-2 text-sm text-slate-500">{error || 'Please sign in again to access the admin console.'}</p>
          <Link
            to="/auth"
            className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!loading && user && !isAuthorised) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  const sidebarLinkClass = (item) =>
    clsx(
      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      active === item.key ? 'bg-primary text-white shadow-card' : 'text-slate-600 hover:bg-slate-100',
    );

  const sidebarContent = (
    <>
      <Link to="/" className="flex items-center gap-3 rounded-3xl bg-primary/10 px-4 py-4">
        <img
          src="/urban_evolution_group_logo.png"
          alt="Urban Evolution Group"
          className="h-10 w-10 rounded-2xl object-contain shadow-card"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Admin Console</p>
          <p className="text-base font-bold text-slate-900">Urban Evolution</p>
        </div>
      </Link>

      <nav className="mt-8 flex-1 space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link key={item.key} to={item.to} onClick={() => setSidebarOpen(false)} className={sidebarLinkClass(item)}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="block rounded-pill border border-slate-200 px-4 py-2 text-center text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
        >
          Back to investor site
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-pill bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-porcelain text-slate-900 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-slate-200 bg-white px-6 py-8 lg:flex">
        {sidebarContent}
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white px-6 py-8 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-white/40 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center rounded-pill border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary lg:hidden"
            >
              Menu
            </button>

            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-900">Admin control centre</p>
              <p className="text-xs text-slate-500">Urban Evolution Group</p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {loading ? <span className="h-4 w-4 animate-pulse rounded-full bg-primary/70" /> : initials}
              </div>
              <div className="min-w-[140px]">
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-2 w-16 animate-pulse rounded-full bg-slate-200" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900">{user?.full_name || user?.email}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-16 pt-10 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
