import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import InvestorLayout from '../components/InvestorLayout';
import { fetchInvestmentSnapshot } from '../api/investments';
import { getProjectDisplayName } from '../utils/projectNaming';
import { formatCurrency } from '../utils/currency';

const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) {
    return '0%';
  }
  return `${Number(value).toFixed(1)}%`;
};

const formatDate = (value, { withTime = false } = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return withTime
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusBadges = {
  pending: { label: 'Funding', tone: 'bg-amber-50 text-amber-700' },
  active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Stabilised', tone: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-rose-50 text-rose-600' },
};

const Attachment = ({ doc }) => (
  <a
    key={doc.id}
    href={doc.url}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2 text-sm text-slate-600 transition hover:border-primary/50 hover:text-primary"
  >
    <div>
      <p className="font-semibold text-slate-900">{doc.title}</p>
      <p className="text-xs uppercase tracking-widest text-slate-400">{doc.type}</p>
    </div>
    <span className="text-xs font-semibold text-primary">Open</span>
  </a>
);

const TimelineEntry = ({ entry, currency }) => (
  <div className="flex items-center justify-between text-sm text-slate-600">
    <div>
      <p className="font-semibold text-slate-900">{formatDate(entry.recordedAt)}</p>
      <p className="text-xs text-slate-400">Cash distribution</p>
    </div>
    <p className="font-semibold text-emerald-600">{formatCurrency(entry.amount, currency)}</p>
  </div>
);

const InvestmentDetailPage = () => {
  const { investmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const loadSnapshot = async () => {
      if (!investmentId) {
        navigate('/investments', { replace: true });
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchInvestmentSnapshot(investmentId);
        setSnapshot(response);
      } catch (err) {
        setError(err.message || 'Unable to load this investment right now.');
      } finally {
        setLoading(false);
      }
    };
    loadSnapshot();
  }, [investmentId, navigate]);

  const investment = snapshot?.investment;
  const summary = snapshot?.summary || {};
  const badge = statusBadges[investment?.status] || statusBadges.active;
  const project = investment?.project || {};
  const group = investment?.group;
  const displayName = getProjectDisplayName(project, group);
  const returnsHistory = investment?.returnsHistory || [];
  const incomeRecords = investment?.income?.records || [];
  const documents = investment?.construction?.documents || [];
  const milestones = investment?.construction?.milestones || [];
  const updates = investment?.construction?.updates || [];
  const gallery = investment?.construction?.sitePhotos || [];

  const backLink = group?.id ? `/groups/${group.id}` : '/investments';

  const totalInvestedLabel = formatCurrency(summary.committed, investment?.currency);
  const totalReturnLabel = formatCurrency(summary.totalReturns, investment?.currency);
  const currentValueLabel = formatCurrency(summary.currentValue, investment?.currency);
  const monthlyIncomeLabel = formatCurrency(summary.monthlyIncome, investment?.currency);

  if (loading) {
    return (
      <InvestorLayout active="investments">
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Loading investment detail...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (error || !investment) {
    return (
      <InvestorLayout active="investments">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 shadow-card">
          {error || 'This investment could not be found.'}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/investments')}
              className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Back to investments
            </button>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout active="investments">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Investment detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{displayName}</h1>
            <p className="text-sm text-slate-500">
              {group?.name || 'Independent circle'} • {project.location || 'Location TBA'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={backLink}
              className="rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/60 hover:text-primary"
            >
              Back to overview
            </Link>
            <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest', badge.tone)}>
              {badge.label}
            </span>
          </div>
        </div>

        {project.featuredImage ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <img src={project.featuredImage} alt={displayName} className="h-72 w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Committed capital</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalInvestedLabel}</p>
            <p className="text-xs text-slate-500">Invested on {formatDate(investment.investmentDate)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Current value</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{currentValueLabel}</p>
            <p className="text-xs text-emerald-600">Includes {totalReturnLabel} total returns</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Monthly income</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{monthlyIncomeLabel}</p>
            <p className="text-xs text-slate-500">Next payout {formatDate(investment.nextReturn?.dueDate)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Ownership</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{investment.ownershipPercent}%</p>
            <p className="text-xs text-slate-500">Plan: {investment.plan || 'Custom'}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-slate-900">Returns timeline</p>
            <span className="text-xs text-slate-500">{returnsHistory.length} entries</span>
          </div>
          <div className="mt-4 space-y-3">
            {returnsHistory.length === 0 ? (
              <p className="text-sm text-slate-500">No returns recorded yet.</p>
            ) : (
              returnsHistory.map((entry) => (
                <TimelineEntry key={entry.recordedAt} entry={entry} currency={investment.currency} />
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-base font-semibold text-slate-900">Income records</p>
          <div className="mt-4 space-y-3">
            {incomeRecords.length === 0 ? (
              <p className="text-sm text-slate-500">No rental income recorded yet.</p>
            ) : (
              incomeRecords.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{formatDate(record.periodEnd)}</p>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(record.shareAmount || record.amount, investment.currency)}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatDate(record.periodStart)} – {formatDate(record.periodEnd)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">Construction progress</p>
              <p className="text-xs text-slate-500">Milestones and site documentation</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {formatPercent(investment.construction?.progressPercent)}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(investment.construction?.progressPercent || 0, 100)}%` }}
            />
          </div>
          <div className="mt-4 space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-slate-500">No milestones submitted yet.</p>
            ) : (
              milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-2xl border border-slate-100 px-4 py-3 text-sm text-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{milestone.title}</p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {formatPercent(milestone.progress || 0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Target {formatDate(milestone.targetDate)}</p>
                </div>
              ))
            )}
          </div>
          {gallery.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {gallery.slice(0, 3).map((photo) => (
                <img key={photo.id} src={photo.url} alt={photo.title} className="h-32 w-full rounded-2xl object-cover" />
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-base font-semibold text-slate-900">Documents & updates</p>
          <div className="mt-4 space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500">No BOQs or files uploaded yet.</p>
            ) : (
              documents.map((doc) => <Attachment key={doc.id} doc={doc} />)
            )}
          </div>
          <div className="mt-6 space-y-3">
            {updates.length === 0 ? (
              <p className="text-sm text-slate-500">No official updates yet.</p>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">{formatDate(update.postedAt)}</p>
                  <p className="text-sm font-semibold text-slate-900">{update.headline}</p>
                  <p className="mt-1 text-sm text-slate-600">{update.body}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </InvestorLayout>
  );
};

export default InvestmentDetailPage;
