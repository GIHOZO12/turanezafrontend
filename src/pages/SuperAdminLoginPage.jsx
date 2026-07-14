import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { fetchSuperAdminMe, saveSuperAdminCreds, clearSuperAdminCreds } from '../api/superadmin';

const SuperAdminLoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await fetchSuperAdminMe();
        navigate('/super-admin', { replace: true });
      } catch (err) {
        // ignore
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const username = form.username.trim();
      const password = form.password;
      saveSuperAdminCreds({ username, password });
      await fetchSuperAdminMe(); // verify credentials
      navigate('/super-admin', { replace: true });
    } catch (err) {
      clearSuperAdminCreds();
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-slate-800 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-card">
            <span className="text-xl font-semibold">UEG</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Super Admin</p>
            <p className="text-xs text-white/70">Restricted access</p>
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {error}
            </div>
          ) : null}
          <div>
            <label className="text-sm font-semibold text-white">Email</label>
            <input
              type="email"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-sunshine focus:ring-2 focus:ring-sunshine/50"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-white">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-sunshine focus:ring-2 focus:ring-sunshine/50"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'w-full rounded-pill bg-sunshine px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition',
              'hover:-translate-y-0.5 hover:bg-sunshine/90 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
