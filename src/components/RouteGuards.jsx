import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { fetchCurrentUser } from '../api/users';
import { fetchSuperAdminMe } from '../api/superadmin';
import NotFoundPage from '../pages/NotFoundPage';

const CheckingSession = () => (
  <div className="flex min-h-screen items-center justify-center bg-porcelain text-sm text-slate-500">
    Checking access...
  </div>
);

const isAdminRole = (user) =>
  Boolean(user) &&
  (user.role === 'admin' || user.role === 'compliance' || user.is_staff || user.is_superuser || user.is_super_admin);

// Guards /admin/* — anyone not logged in, or logged in without an
// admin/compliance/staff role, sees a plain 404 instead of the admin
// console or a redirect that would confirm the route exists.
export const RequireAdmin = () => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser()
      .then((user) => {
        if (mounted) setStatus(isAdminRole(user) ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (mounted) setStatus('denied');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'checking') return <CheckingSession />;
  if (status === 'denied') return <NotFoundPage />;
  return <Outlet />;
};

// Guards /super-admin/* (except the login page itself) — the same Basic
// Auth session check every super-admin page already does individually,
// centralised so a page can't be added later without it.
//
// The super-admin panel uses a completely separate Basic Auth session from
// the regular JWT login — a user can have is_super_admin=true on their
// regular account (and even get auto-routed here straight from /auth) yet
// never have completed the separate /super-admin/login step. Denying those
// two situations the same way (a dead-end 404) locks out real super admins
// with no way forward. So on Basic Auth failure, check whether their
// regular session says they're a super admin: if so, send them to
// /super-admin/login (already an openly reachable URL, so this reveals
// nothing new) instead of a 404; only truly unprivileged visitors get 404.
export const RequireSuperAdmin = () => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    fetchSuperAdminMe()
      .then(() => {
        if (mounted) setStatus('allowed');
      })
      .catch(() => {
        fetchCurrentUser()
          .then((user) => {
            if (mounted) setStatus(user?.is_super_admin ? 'needs-super-admin-login' : 'denied');
          })
          .catch(() => {
            if (mounted) setStatus('denied');
          });
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'checking') return <CheckingSession />;
  if (status === 'denied') return <NotFoundPage />;
  if (status === 'needs-super-admin-login') return <Navigate to="/super-admin/login" replace />;
  return <Outlet />;
};
