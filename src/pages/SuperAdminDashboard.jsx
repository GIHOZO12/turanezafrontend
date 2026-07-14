import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SuperAdminShell from '../components/SuperAdminShell';
import { fetchSuperAdminDashboard, fetchSuperAdminMe } from '../api/superadmin';

const badgeClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'submitted':
    case 'under_review':
    case 'verified_with_bank':
      return 'bg-amber-100 text-amber-700';
    case 'rejected':
    case 'flagged_fraud':
      return 'bg-rose-100 text-rose-700';
    case 'inactive':
    case 'archived':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const StatCard = ({ label, value }) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchSuperAdminMe();
        const payload = await fetchSuperAdminDashboard();
        setData(payload);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard.');
        navigate('/super-admin/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-porcelain text-slate-700">
        Loading control center...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-porcelain text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <SuperAdminShell title="Control Center" subtitle="Super Admin">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pending payment proofs" value={data?.counts?.pending_payment_proofs || 0} />
          <StatCard label="Groups needing attention" value={data?.counts?.groups_needing_attention || 0} />
          <StatCard label="Suspended users" value={data?.counts?.suspended_users || 0} />
          <StatCard label="Active groups" value={data?.counts?.active_groups || 0} />
          <StatCard label="Investment interest forms" value={data?.counts?.investment_interest_submissions || 0} />
          <StatCard label="Contact form messages" value={data?.counts?.contact_submissions || 0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Pending payment proofs</h2>
              <Link
                to="/super-admin/payments"
                className="text-xs font-semibold text-primary hover:text-primary/80"
              >
                View queue
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.pending_payment_proofs?.length ? (
                data.pending_payment_proofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {proof.user_name || proof.user_email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {proof.amount} {proof.currency} · Ref: {proof.reference || 'N/A'}
                      </p>
                    </div>
                    <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${badgeClass(proof.status)}`}>
                      {proof.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No proofs waiting right now.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Groups needing attention</h2>
            <div className="mt-4 space-y-3">
              {data?.groups_needing_attention?.length ? (
                data.groups_needing_attention.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        Pending applications: {group.pending_applications} · Overdue installments:{' '}
                        {group.overdue_installments}
                      </p>
                    </div>
                    <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${badgeClass(group.status)}`}>
                      {group.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">All groups are stable.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent investment interest</h2>
              <Link
                to="/super-admin/audit-logs?tab=investments"
                className="text-xs font-semibold text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recent_investment_interest?.length ? (
                data.recent_investment_interest.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {item.email} · ${item.desired_investment} · {item.housing_interest_label}
                      </p>
                    </div>
                    <span className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No investment interest forms yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent contact messages</h2>
              <Link
                to="/super-admin/audit-logs?tab=contacts"
                className="text-xs font-semibold text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recent_contact_submissions?.length ? (
                data.recent_contact_submissions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <span className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.topic_label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.email}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {item.message.slice(0, 120)}
                      {item.message.length > 120 ? '...' : ''}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No contact messages yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent critical actions</h2>
            <div className="mt-4 space-y-3">
              {data?.recent_actions?.length ? (
                data.recent_actions.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{log.action_type}</p>
                      <p className="text-xs text-slate-500">
                        {log.actor_email || 'System'} · {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {log.target_type || 'SYSTEM'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No critical actions yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Suspended users</h2>
            <div className="mt-4 space-y-3">
              {data?.suspended_users?.length ? (
                data.suspended_users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.full_name || user.email}</p>
                      <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                    <span className="rounded-pill bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                      Suspended
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No suspended users.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SuperAdminShell>
  );
};

export default SuperAdminDashboard;
