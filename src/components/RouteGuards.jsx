import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
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
export const RequireSuperAdmin = () => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    fetchSuperAdminMe()
      .then(() => {
        if (mounted) setStatus('allowed');
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
