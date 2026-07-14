import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import AdminLayout from '../components/AdminLayout';
import { fetchAdminDashboard } from '../api/admin';
import { formatCurrency } from '../utils/currency';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAdminDashboard();
        if (mounted) {
          setData(response);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Unable to load admin analytics at the moment.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminLayout active="dashboard">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Platform health</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Admin control centre</h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor investor onboarding, group performance, and compliance obligations across Urban Evolution Group.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="rounded-pill bg-slate-100 px-3 py-1 font-semibold">
            {new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
      </section>

      {loading ? (
        <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-card">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p>Calculating live metrics...</p>
          </div>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{error}</div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Verified investors</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{data.users.investors}</p>
              <p className="mt-2 text-xs text-slate-500">
                {data.users.pendingVerification} pending verification • {data.users.newLast30} joined in last 30 days
              </p>
            </article>
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Investment commitments</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {formatCurrency(data.investments.totalCommitments)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Paid {formatCurrency(data.investments.totalPaid)} • Returns {formatCurrency(data.investments.totalReturns)}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Active groups</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{data.groups.active}</p>
              <p className="mt-2 text-xs text-slate-500">
                {data.groups.applications.pending} applications pending • {data.groups.applications.underReview} in review
              </p>
            </article>
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Compliance posture</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{data.compliance.verified}</p>
              <p className="mt-2 text-xs text-slate-500">
                {data.compliance.pending} pending • {data.compliance.rejected} flagged • {data.compliance.missingDocuments}{' '}
                missing documentation
              </p>
            </article>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Latest investors</p>
                  <p className="text-xs text-slate-500">Recent account activations and verification state</p>
                </div>
                <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {data.users.recent.length}
                </span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-3">Investor</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.users.recent.map((user) => (
                      <tr key={user.id} className="text-xs text-slate-600">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{user.fullName || user.email}</p>
                          <p className="text-slate-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-3 uppercase tracking-widest text-slate-400">{user.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              'rounded-pill px-3 py-1 text-xs font-semibold',
                              user.verification === 'verified'
                                ? 'bg-emerald-100 text-emerald-700'
                                : user.verification === 'rejected'
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-amber-100 text-amber-600',
                            )}
                          >
                            {user.verification}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(user.joinedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Recent commitments</p>
                  <p className="text-xs text-slate-500">Monitoring capital allocation as it happens</p>
                </div>
                <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {data.investments.recent.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {data.investments.recent.map((investment) => (
                  <div
                    key={investment.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-800">
                        {investment.investor || 'Unknown investor'} · {investment.project}
                      </p>
                      <span
                        className={clsx(
                          'rounded-pill px-3 py-1 font-semibold',
                          investment.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : investment.status === 'pending'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-slate-200 text-slate-600',
                        )}
                      >
                        {investment.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(investment.amount, investment.currency)}
                      </span>
                      {investment.group ? <span className="text-slate-500">Group · {investment.group}</span> : null}
                      <span className="text-slate-400">
                        {new Date(investment.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Priority projects</p>
                  <p className="text-xs text-slate-500">Monitor funding progress and capital needs</p>
                </div>
                <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {data.groups.recentProjects.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {data.groups.recentProjects.map((project) => {
                  const fundingGoal = Number(project.fundingGoal || 0);
                  const currentValue = Number(project.currentValue || 0);
                  const progress = fundingGoal > 0 ? Math.min(100, Math.round((currentValue / fundingGoal) * 100)) : 0;
                  return (
                    <div key={project.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{project.name}</p>
                          <p className="text-slate-500">{project.group || 'Independent project'}</p>
                        </div>
                        <span className="rounded-pill bg-slate-200 px-3 py-1 font-semibold uppercase tracking-widest text-slate-500">
                          {project.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Raised {formatCurrency(project.currentValue, project.currency)}</span>
                          <span>Goal {formatCurrency(project.fundingGoal, project.currency)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Activity timeline</p>
                  <p className="text-xs text-slate-500">Latest payments, applications, and governance events</p>
                </div>
                <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {data.activity.length}
                </span>
              </div>
              <ul className="mt-4 space-y-3 text-xs text-slate-600">
                {data.activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="mt-[3px] h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-semibold text-slate-800">{item.title || item.type}</p>
                      <p className="mt-1 text-slate-500">
                        {item.actor ? `${item.actor} · ` : ''}
                        {item.group ? `Group ${item.group}` : ''}
                        {item.project ? `Project ${item.project}` : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default AdminDashboardPage;
