import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminUsers, updateAdminUser } from '../api/admin';

const roleOptions = [
  { label: 'All roles', value: '' },
  { label: 'Member', value: 'member' },
  { label: 'Investor', value: 'investor' },
  { label: 'Admin', value: 'admin' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Silver', value: 'silver' },
  { label: 'Gold', value: 'gold' },
  { label: 'Diamond', value: 'diamond' },
  { label: 'Platinum', value: 'platinum' },
];

const verificationOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Verified', value: 'verified' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
];

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async (query = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminUsers(query);
      const records = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : [];
      setUsers(records);
    } catch (err) {
      setError(err.message || 'Unable to retrieve users right now.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        verification: verificationFilter || undefined,
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, roleFilter, verificationFilter]);

  const handleUpdate = async (id, payload) => {
    setUpdatingId(id);
    setError(null);
    try {
      await updateAdminUser(id, payload);
      await fetchUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        verification: verificationFilter || undefined,
      });
    } catch (err) {
      setError(err.message || 'Unable to update user at the moment.');
    } finally {
      setUpdatingId(null);
    }
  };

  const totals = useMemo(() => {
    const totalInvestments = users.reduce((acc, user) => acc + Number(user.investments_total || 0), 0);
    const avgInvestments = users.length ? totalInvestments / users.length : 0;
    const withTwoFa = users.filter((user) => user.twofa_enabled).length;
    return {
      count: users.length,
      totalInvestments,
      avgInvestments,
      withTwoFa,
    };
  }, [users]);

  return (
    <AdminLayout active="users">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">User management</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Control membership, roles, and access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Search and triage members. Update roles, enable MFA, and monitor verification flows.
          </p>
        </div>
        <div className="rounded-3xl bg-white px-4 py-2 text-xs text-slate-600 shadow-card">
          <span className="font-semibold text-slate-900">{totals.count}</span> users in view ·{' '}
          <span className="font-semibold text-slate-900">{totals.withTwoFa}</span> with 2FA enabled
        </div>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-card">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-xs uppercase tracking-widest text-slate-400">Search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, phone"
            className="w-full bg-transparent text-sm text-slate-600 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={verificationFilter}
          onChange={(event) => setVerificationFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
        >
          {verificationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p>Fetching investors...</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{error}</div>
      ) : null}

      {!loading && !error ? (
        <section className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Investor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Investments</th>
                <th className="px-4 py-3">Groups</th>
                <th className="px-4 py-3">2FA</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {users.map((user) => (
                <tr key={user.id} className="transition duration-150 ease-in-out hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{user.full_name || user.email}</p>
                    <p className="text-slate-500">{user.email}</p>
                    <p className="text-[11px] text-slate-400">{user.phone || 'No phone provided'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(event) => handleUpdate(user.id, { role: event.target.value })}
                      className="rounded-pill border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-primary focus:outline-none"
                    >
                      {roleOptions
                        .filter((option) => option.value !== '')
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.verification}
                      disabled={updatingId === user.id}
                      onChange={(event) => handleUpdate(user.id, { verification: event.target.value })}
                      className="rounded-pill border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-primary focus:outline-none"
                    >
                      {verificationOptions
                        .filter((option) => option.value !== '')
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      $
                      {Number(user.investments_total || 0).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {user.last_login_display
                        ? `Last login ${new Date(user.last_login_display).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}`
                        : 'Never logged in'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{user.membership_count}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={updatingId === user.id}
                      onClick={() => handleUpdate(user.id, { twofa_enabled: !user.twofa_enabled })}
                      className={clsx(
                        'rounded-pill px-3 py-1 text-xs font-semibold transition duration-150 ease-in-out',
                        user.twofa_enabled
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300',
                      )}
                    >
                      {user.twofa_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(user.date_joined).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </AdminLayout>
  );
};

export default AdminUsersPage;

