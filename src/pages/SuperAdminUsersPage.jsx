import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  fetchSuperAdminMe,
  fetchSuperAdminUsers,
  promoteSuperAdminUser,
  reinstateSuperAdminUser,
  suspendSuperAdminUser,
} from '../api/superadmin';
import { useNavigate } from 'react-router-dom';

const tiers = ['member', 'aspiring', 'silver', 'gold', 'diamond', 'platinum', 'investor', 'admin', 'compliance'];

const SuperAdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [actingId, setActingId] = useState(null);
  const [reasonByUser, setReasonByUser] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const data = await fetchSuperAdminUsers();
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
      navigate('/super-admin/login', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter((user) => `${user.full_name} ${user.email} ${user.role}`.toLowerCase().includes(q));
  }, [users, query]);

  const handleSuspend = async (id) => {
    setActingId(id);
    try {
      const reason = reasonByUser[id] || '';
      await suspendSuperAdminUser(id, { reason });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to suspend user.');
    } finally {
      setActingId(null);
    }
  };

  const handleReinstate = async (id) => {
    setActingId(id);
    try {
      const reason = reasonByUser[id] || '';
      await reinstateSuperAdminUser(id, { reason });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to reinstate user.');
    } finally {
      setActingId(null);
    }
  };

  const handlePromote = async (id, tier) => {
    setActingId(id);
    try {
      const reason = reasonByUser[id] || 'Super Admin update';
      await promoteSuperAdminUser(id, { new_tier: tier, reason });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update tier.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <SuperAdminShell title="Users" subtitle="Super Admin">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-pill border border-slate-200 px-4 py-2 text-sm"
          placeholder="Search by name, email, role..."
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-sm text-slate-600">Loading users...</div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((user) => (
            <div key={user.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.full_name || user.email}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-pill bg-slate-100 px-3 py-1 font-semibold text-slate-600">{user.role}</span>
                  <span
                    className={`rounded-pill px-3 py-1 font-semibold ${
                      user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-4 text-xs text-slate-500 md:grid-cols-3">
                <div>
                  <p className="font-semibold text-slate-700">Memberships</p>
                  <p>{user.membership_count || 0} active groups</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Committed</p>
                  <p>{user.total_committed || '0'} total</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Paid</p>
                  <p>{user.payments_paid || '0'} paid</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Reason (optional)
                </label>
                <input
                  value={reasonByUser[user.id] || ''}
                  onChange={(e) =>
                    setReasonByUser((prev) => ({
                      ...prev,
                      [user.id]: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-pill border border-slate-200 px-3 py-2 text-xs"
                  placeholder="Reason for suspension, reinstatement, or tier update"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <select
                  className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handlePromote(user.id, e.target.value);
                    e.target.value = '';
                  }}
                  disabled={actingId === user.id}
                >
                  <option value="" disabled>
                    Update tier
                  </option>
                  {tiers.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
                {user.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleSuspend(user.id)}
                    disabled={actingId === user.id}
                    className="rounded-pill bg-rose-500 px-3 py-2 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReinstate(user.id)}
                    disabled={actingId === user.id}
                    className="rounded-pill bg-emerald-500 px-3 py-2 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Reinstate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SuperAdminShell>
  );
};

export default SuperAdminUsersPage;
