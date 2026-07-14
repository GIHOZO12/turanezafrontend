import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import InvestorLayout from '../components/InvestorLayout';
import { fetchInvestmentPortfolio } from '../api/investments';
import { getProjectDisplayName } from '../utils/projectNaming';
import { formatCurrency } from '../utils/currency';

const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) {
    return '0%';
  }
  const numeric = Number(value);
  return `${numeric.toFixed(1)}%`;
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatMonthLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const statusBadges = {
  pending: { label: 'Funding', tone: 'bg-amber-50 text-amber-700' },
  funding: { label: 'Funding', tone: 'bg-amber-50 text-amber-700' },
  active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700' },
  completed: { label: 'Stabilised', tone: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-rose-50 text-rose-600' },
};

const tabDefinitions = [
  { key: 'portfolio', label: 'My Investments' },
  { key: 'performance', label: 'Performance' },
  { key: 'income', label: 'Income Tracking' },
];

const defaultStatusFilters = [
  { key: 'all', label: 'All investments' },
  { key: 'pending', label: 'Funding' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Stabilised' },
  { key: 'cancelled', label: 'Cancelled' },
];

const timeframeOptions = ['3m', '6m', '12m', '24m'];

const SummaryCard = ({ label, value, hint }) => (
  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
  </div>
);

const StatusChip = ({ label, value, tone }) => (
  <div className={clsx('rounded-2xl border px-4 py-3 text-sm font-semibold', tone || 'border-slate-200 text-slate-600')}>
    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</p>
    <p className="mt-1 text-base text-slate-900">{value}</p>
  </div>
);

const MiniTimeline = ({ items }) => (
  <div className="space-y-2">
    {items.length === 0 ? (
      <p className="text-xs text-slate-500">Distributions will appear once returns are posted.</p>
    ) : (
      items.map((entry) => (
        <div key={entry.label} className="flex items-center gap-3">
          <span className="w-20 text-xs font-semibold text-slate-500">{entry.label}</span>
          <div className="flex-1 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${Math.min(100, entry.percent || 0)}%` }}
            />
          </div>
          <span className="w-20 text-right text-xs font-semibold text-slate-900">
            {formatCurrency(entry.amount)}
          </span>
        </div>
      ))
    )}
  </div>
);

const AttachmentLink = ({ doc }) => (
  <a
    key={doc.id}
    href={doc.url}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2 text-sm text-slate-600 transition hover:border-primary/50 hover:text-primary"
  >
    <div>
      <p className="font-semibold text-slate-900">{doc.title}</p>
      <p className="text-xs uppercase tracking-wider text-slate-400">{doc.type}</p>
    </div>
    <span className="text-xs font-semibold text-primary">Open</span>
  </a>
);

const InvestmentCard = ({ investment, compact = false }) => {
  const badge = statusBadges[investment.project?.status || investment.status] || statusBadges.active;
  const groupLabel = investment.group?.name || 'Independent circle';
  const locationLabel = investment.project?.location || 'Location TBA';
  const displayName = getProjectDisplayName(investment.project, investment.group);
  const roiLabel = formatPercent(investment.roiPercent);
  const ownershipLabel = investment.ownershipPercent ? `${investment.ownershipPercent}%` : '—';
  const latestUpdate = investment.construction?.updates?.[0];
  const milestoneList = investment.construction?.milestones || [];
  const documents = investment.construction?.documents || [];
  const gallery = investment.construction?.sitePhotos || [];
  const incomeRecords = investment.income?.records || [];
  const returnsHistory = investment.returnsHistory || [];
  const statusLabel = investment.project?.status || investment.status;

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-900">{displayName}</h3>
            <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest', badge.tone)}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {groupLabel} • {locationLabel}
          </p>
          <p className="text-xs text-slate-400">Joined {formatDate(investment.investmentDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ROI</p>
          <p className="text-2xl font-semibold text-emerald-600">{roiLabel}</p>
          <p className="text-xs text-slate-500">Ownership {ownershipLabel}</p>
        </div>
      </div>

      <div className={clsx('grid gap-4', compact ? 'mt-4 sm:grid-cols-2' : 'mt-5 md:grid-cols-3')}>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Investment</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(investment.committedAmount, investment.currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Current value</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(investment.currentValue, investment.currency)}
          </p>
          <p className="text-xs text-emerald-600">+ {formatCurrency(investment.totalReturns, investment.currency)} total returns</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Monthly income</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatCurrency(investment.monthlyIncome, investment.currency)}
          </p>
          <p className="text-xs text-slate-500">Next payout {formatDate(investment.nextReturn?.dueDate)}</p>
        </div>
      </div>

      {!compact && investment.project?.featuredImage ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <img
            src={investment.project.featuredImage}
            alt={displayName}
            className="h-64 w-full object-cover"
          />
        </div>
      ) : null}

      {!compact ? (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Returns timeline</p>
                <span className="text-xs text-slate-500">{returnsHistory.length} entries</span>
              </div>
              <div className="mt-4 space-y-2">
                {returnsHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No returns recorded yet.</p>
                ) : (
                  returnsHistory.map((entry) => (
                    <div key={entry.recordedAt} className="flex items-center justify-between text-sm text-slate-600">
                      <span>{formatDate(entry.recordedAt)}</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(entry.amount, investment.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Income tracking</p>
                <span className="text-xs text-slate-500">Last {incomeRecords.length} periods</span>
              </div>
              <div className="mt-4 space-y-2">
                {incomeRecords.length === 0 ? (
                  <p className="text-xs text-slate-500">No rental income recorded yet.</p>
                ) : (
                  incomeRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between text-sm text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-900">{formatMonthLabel(record.periodEnd)}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(record.periodStart)} – {formatDate(record.periodEnd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(record.shareAmount || record.amount)}</p>
                        {record.shareAmount ? (
                          <p className="text-xs text-slate-400">of {formatCurrency(record.amount, record.currency)}</p>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Latest update</p>
              {latestUpdate ? (
                <>
                  <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">{formatDate(latestUpdate.postedAt)}</p>
                  <p className="text-sm font-semibold text-slate-900">{latestUpdate.headline}</p>
                  <p className="mt-2 text-sm text-slate-600">{latestUpdate.body}</p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No official updates yet.</p>
              )}
              <div className="mt-4 space-y-2">
                {documents.slice(0, 3).map((doc) => (
                  <AttachmentLink key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          </div>

          {statusLabel !== 'completed' ? (
            <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Construction progress</p>
                  <p className="text-xs text-slate-500">Tracked via submitted milestones & BoQs</p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {formatPercent(investment.construction?.progressPercent)}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(investment.construction?.progressPercent || 0, 100)}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {milestoneList.slice(0, 4).map((milestone) => (
                  <div key={milestone.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{milestone.title}</p>
                    <p className="text-xs text-slate-400">Target {formatDate(milestone.targetDate)}</p>
                    <p className="text-xs text-slate-500">Progress {formatPercent(milestone.progress || 0)}</p>
                  </div>
                ))}
                {milestoneList.length === 0 ? <p className="text-xs text-slate-500">No milestones submitted yet.</p> : null}
              </div>
              {gallery.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {gallery.slice(0, 3).map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={photo.title}
                      className="h-32 w-full rounded-2xl object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Status: <span className="font-semibold text-slate-900">{statusLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/groups/${investment.group?.id || ''}`}
            className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/60 hover:text-primary"
          >
            View group
          </Link>
          <Link
            to={`/investments/${investment.id}`}
            className="rounded-pill bg-primary px-5 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
};

const InvestmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('portfolio');
  const [timeframe, setTimeframe] = useState('12m');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchInvestmentPortfolio();
        setPortfolio(response);
      } catch (err) {
        setError(err.message || 'Unable to load your investments right now.');
      } finally {
        setLoading(false);
      }
    };
    loadPortfolio();
  }, []);

  const summary = portfolio?.summary || {};
  const statusFilters = portfolio?.filters?.statuses || defaultStatusFilters;
  const investments = useMemo(() => portfolio?.investments || [], [portfolio]);

  const statusBreakdown = useMemo(
    () =>
      investments.reduce(
        (acc, investment) => {
          const key = (investment.status || 'pending').toLowerCase();
          acc[key] = (acc[key] || 0) + 1;
          acc.total = (acc.total || 0) + 1;
          return acc;
        },
        { total: 0 },
      ),
    [investments],
  );

  const upcomingReturns = useMemo(() => {
    const today = Date.now();
    return investments
      .map((investment) => ({
        id: investment.id,
        project: investment.project?.name || 'Project',
        amount: investment.nextReturn?.amount,
        dueDate: investment.nextReturn?.dueDate,
      }))
      .filter((entry) => entry.amount && entry.dueDate && new Date(entry.dueDate).getTime() >= today)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [investments]);

  const incomeTimeline = useMemo(() => {
    const map = new Map();
    investments.forEach((investment) => {
      (investment.income?.records || []).forEach((record) => {
        const rawDate = record.periodEnd ? Date.parse(record.periodEnd) : NaN;
        if (Number.isNaN(rawDate)) return;
        const label = formatMonthLabel(record.periodEnd);
        if (!label) return;
        const amount = Number(record.shareAmount || record.amount || 0);
        if (!Number.isFinite(amount) || amount === 0) return;
        map.set(rawDate, { label, amount: (map.get(rawDate)?.amount || 0) + amount });
      });
    });
    const entries = Array.from(map.entries())
      .map(([timestamp, { label, amount }]) => ({ label, amount, timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6);
    const maxAmount = Math.max(...entries.map((entry) => entry.amount), 1);
    return entries.map((entry) => ({
      label: entry.label,
      amount: entry.amount,
      percent: (entry.amount / maxAmount) * 100,
    }));
  }, [investments]);

  const incomeTableRows = useMemo(() => {
    const rows = [];
    investments.forEach((investment) => {
      (investment.income?.records || []).forEach((record) => {
        rows.push({
          id: `${investment.id}-${record.id || record.periodEnd}`,
          project: investment.project?.name || 'Project',
          periodStart: record.periodStart,
          periodEnd: record.periodEnd,
          amount: record.shareAmount || record.amount,
          currency: investment.currency,
        });
      });
    });
    return rows.sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd));
  }, [investments]);

  const filteredInvestments = useMemo(() => {
    if (statusFilter === 'all') {
      return investments;
    }
    return investments.filter((investment) => (investment.status || '').toLowerCase() === statusFilter);
  }, [investments, statusFilter]);

  if (loading) {
    return (
      <InvestorLayout active="investments">
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Loading your investment tracker...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (error) {
    return (
      <InvestorLayout active="investments">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600 shadow-card">{error}</div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout active="investments">
      <section className="rounded-3xl bg-white p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Investment tracker</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Monitor your portfolio performance</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live overview of committed capital, realised returns, and income per property.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              {timeframeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/60 hover:text-primary"
              disabled
            >
              Export report
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total invested" value={formatCurrency(summary.totalInvested)} />
          <SummaryCard label="Current value" value={formatCurrency(summary.currentValue)} />
          <SummaryCard label="Total returns" value={formatCurrency(summary.totalReturns)} />
          <SummaryCard label="Average ROI" value={formatPercent(summary.avgRoi)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900">Portfolio breakdown</p>
            <p className="text-xs text-slate-500">Active vs completed investments</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <StatusChip
                label="Active deals"
                value={statusBreakdown.active || 0}
                tone="border-emerald-200 text-emerald-700"
              />
              <StatusChip
                label="Funding"
                value={statusBreakdown.pending || statusBreakdown.funding || 0}
                tone="border-amber-200 text-amber-700"
              />
              <StatusChip
                label="Stabilised"
                value={statusBreakdown.completed || 0}
                tone="border-slate-200 text-slate-600"
              />
              <StatusChip label="Total" value={statusBreakdown.total || 0} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Upcoming payouts</p>
              <span className="text-xs text-slate-400">{upcomingReturns.length} items</span>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingReturns.length === 0 ? (
                <p className="text-xs text-slate-500">No scheduled payouts yet.</p>
              ) : (
                upcomingReturns.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.project}</p>
                      <p className="text-xs text-slate-400">Due {formatDate(entry.dueDate)}</p>
                    </div>
                    <span className="font-semibold text-primary">{formatCurrency(entry.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900">Income timeline</p>
            <p className="text-xs text-slate-500">Last six recorded months</p>
            <div className="mt-4">
              <MiniTimeline items={incomeTimeline} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          {tabDefinitions.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'rounded-pill px-4 py-2 text-sm font-semibold transition',
                activeTab === tab.key ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-primary/10 hover:text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'performance' ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <p className="text-base font-semibold text-slate-900">Performance overview</p>
              <p className="text-xs text-slate-500">Status of every allocation in your portfolio</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatusChip label="Active" value={statusBreakdown.active || 0} tone="border-emerald-200 text-emerald-700" />
                <StatusChip label="Funding" value={(statusBreakdown.pending || 0) + (statusBreakdown.funding || 0)} tone="border-amber-200 text-amber-700" />
                <StatusChip label="Stabilised" value={statusBreakdown.completed || 0} tone="border-slate-200 text-slate-600" />
                <StatusChip label="Cancelled" value={statusBreakdown.cancelled || 0} tone="border-rose-200 text-rose-600" />
              </div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Income timeline</p>
                <MiniTimeline items={incomeTimeline} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <p className="text-base font-semibold text-slate-900">Upcoming payouts</p>
              <div className="mt-4 space-y-3">
                {upcomingReturns.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments scheduled.</p>
                ) : (
                  upcomingReturns.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{entry.project}</p>
                        <span className="font-semibold text-primary">{formatCurrency(entry.amount)}</span>
                      </div>
                      <p className="text-xs text-slate-400">Due {formatDate(entry.dueDate)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'income' ? (
          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">Income distribution table</p>
              <span className="text-xs text-slate-500">{incomeTableRows.length} records</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-600">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    <th className="py-2 text-left">Project</th>
                    <th className="py-2 text-left">Period</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeTableRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-xs text-slate-500">
                        Rental income will appear once distributions are posted.
                      </td>
                    </tr>
                  ) : (
                    incomeTableRows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 font-semibold text-slate-900">{row.project}</td>
                        <td className="py-3 text-slate-500">
                          {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(row.amount, row.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === 'portfolio' ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-xs uppercase tracking-widest text-slate-400">Filter</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                >
                  {statusFilters.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400">
                  Showing {filteredInvestments.length} {filteredInvestments.length === 1 ? 'investment' : 'investments'}
                </p>
                <div className="inline-flex items-center rounded-pill border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      'rounded-l-pill px-3 py-1 text-xs font-semibold',
                      viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500',
                    )}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('compact')}
                    className={clsx(
                      'rounded-r-pill px-3 py-1 text-xs font-semibold',
                      viewMode === 'compact' ? 'bg-primary text-white' : 'text-slate-500',
                    )}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>

            {filteredInvestments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
                No investments match the selected filter yet.
              </div>
            ) : (
              <div className={clsx(viewMode === 'compact' ? 'grid gap-4 md:grid-cols-2' : 'space-y-6')}>
                {filteredInvestments.map((investment) => (
                  <InvestmentCard key={investment.id} investment={investment} compact={viewMode === 'compact'} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>
    </InvestorLayout>
  );
};

export default InvestmentsPage;
