import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { fetchAllGroups, fetchGroupApplications } from '../api/groups';

const statusBadge = (status) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'inactive':
      return 'bg-slate-200 text-slate-600';
    case 'archived':
      return 'bg-rose-100 text-rose-600';
    default:
      return 'bg-slate-200 text-slate-600';
  }
};

const AdminGroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsResponse, applicationsResponse] = await Promise.all([fetchAllGroups(), fetchGroupApplications()]);
      const groupRecords = Array.isArray(groupsResponse?.results)
        ? groupsResponse.results
        : Array.isArray(groupsResponse)
        ? groupsResponse
        : [];
      const applicationRecords = Array.isArray(applicationsResponse?.results)
        ? applicationsResponse.results
        : Array.isArray(applicationsResponse)
        ? applicationsResponse
        : [];
      setGroups(groupRecords);
      setApplications(applicationRecords);
    } catch (err) {
      setError(err.message || 'Unable to load group data at this time.');
      setGroups([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter((group) => group.status === 'active').length;
    const pendingApplications = applications.filter((application) => application.status === 'pending').length;
    const underReview = applications.filter((application) => application.status === 'review').length;
    return { total, active, pendingApplications, underReview };
  }, [groups, applications]);

  return (
    <AdminLayout active="groups">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Groups & capital pools</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Oversee investor collectives and intake</h1>
          <p className="mt-2 text-sm text-slate-500">
            Analyse group performance, keep an eye on application queues, and monitor capital mobilisation.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-pill border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
        >
          Refresh
        </button>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Groups onboarded</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p>
          <p className="mt-2 text-xs text-slate-500">{stats.active} currently fundraising or deploying capital</p>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pending applications</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.pendingApplications}</p>
          <p className="mt-2 text-xs text-slate-500">{stats.underReview} under deeper due diligence</p>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Average investors per group</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {groups.length
              ? Math.round(
                  groups.reduce((acc, group) => acc + (group.members_count || 0), 0) / groups.length,
                )
              : 0}
          </p>
          <p className="mt-2 text-xs text-slate-500">Includes both active and prospective members</p>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Application conversion</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {stats.pendingApplications + stats.underReview > 0
              ? `${Math.round(
                  (stats.active / (stats.pendingApplications + stats.underReview + stats.active)) * 100,
                )}%`
              : 'N/A'}
          </p>
          <p className="mt-2 text-xs text-slate-500">Ratio of active groups relative to application volume</p>
        </article>
      </section>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p>Gathering group metrics...</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{error}</div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {groups.map((group) => (
                  <tr key={group.id} className="transition duration-150 ease-in-out hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{group.name}</p>
                      <p className="text-slate-500">{group.description || 'No mission statement provided.'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {group.created_by?.full_name || group.created_by?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">{group.members_count || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(group.status)}`}>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {group.created_at
                        ? new Date(group.created_at).toLocaleDateString(undefined, {
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

          <section className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Application pipeline</p>
                <p className="text-xs text-slate-500">Track applicants and eligibility readiness</p>
              </div>
              <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {applications.length}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Group</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Financial readiness</th>
                    <th className="px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {applications.map((application) => (
                    <tr key={application.id} className="transition duration-150 ease-in-out hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{application.name}</p>
                        <p className="text-slate-500">{application.email}</p>
                        <p className="text-[11px] text-slate-400">
                          Motivation: {application.motivation?.slice(0, 60) || 'Not provided'}
                          {application.motivation && application.motivation.length > 60 ? '…' : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3">{application.group || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                            application.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : application.status === 'rejected'
                              ? 'bg-rose-100 text-rose-600'
                              : application.status === 'review'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {application.financial_ready ? (
                          <span className="rounded-pill bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Ready
                          </span>
                        ) : (
                          <span className="rounded-pill bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                            Pending review
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(application.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default AdminGroupsPage;

