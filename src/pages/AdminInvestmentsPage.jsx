import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { fetchInvestments } from '../api/investments';
import { formatCurrency } from '../utils/currency';

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Funding', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const AdminInvestmentsPage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchInvestments(filters);
      const records = Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
        ? response
        : [];
      setInvestments(records);
    } catch (err) {
      setError(err.message || 'Unable to load investment ledger.');
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    load(statusFilter ? { status: statusFilter } : {});
  }, [statusFilter]);

  const aggregates = useMemo(() => {
    const totalCommitments = investments.reduce((acc, investment) => acc + Number(investment.committed_amount || 0), 0);
    const byStatus = investments.reduce(
      (acc, investment) => {
        const status = investment.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { pending: 0, active: 0, completed: 0, cancelled: 0 },
    );
    return { totalCommitments, byStatus };
  }, [investments]);

  return (
    <AdminLayout active="investments">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Investment ledger</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Analyse commitments and capital flows</h1>
          <p className="mt-2 text-sm text-slate-500">
            See every investor allocation, monitor workflow stages, and identify projects needing follow-up.
          </p>
        </div>
        <div className="rounded-3xl bg-white px-4 py-2 text-xs text-slate-600 shadow-card">
          <span className="font-semibold text-slate-900">
            {formatCurrency(aggregates.totalCommitments)}
          </span>{' '}
          committed across {investments.length} allocations
        </div>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-card">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="rounded-pill bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
            {aggregates.byStatus.active || 0} active
          </span>
          <span className="rounded-pill bg-amber-100 px-3 py-1 font-semibold text-amber-700">
            {aggregates.byStatus.pending || 0} funding
          </span>
          <span className="rounded-pill bg-slate-200 px-3 py-1 font-semibold text-slate-600">
            {aggregates.byStatus.completed || 0} completed
          </span>
        </div>
      </section>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p>Loading investment records...</p>
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
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Commitment</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {investments.map((investment) => (
                <tr key={investment.id} className="transition duration-150 ease-in-out hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{investment.user?.full_name || investment.user?.email}</p>
                    <p className="text-slate-500">{investment.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{investment.project_name || investment.project}</p>
                  </td>
                  <td className="px-4 py-3">{investment.group_name || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                        {formatCurrency(investment.committed_amount, investment.currency || 'USD')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      App fee {investment.app_fee_usd_paid ? 'paid' : 'pending'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {investment.plan ? investment.plan.replace(/^\w/, (char) => char.toUpperCase()) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                        investment.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : investment.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : investment.status === 'completed'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {investment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {investment.approved_at
                      ? new Date(investment.approved_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
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

export default AdminInvestmentsPage;
