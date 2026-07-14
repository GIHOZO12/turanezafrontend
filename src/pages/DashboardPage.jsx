import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import MembershipStatusBar from '../components/MembershipStatusBar';
import { fetchDashboardSnapshot } from '../api/dashboard';
import { membershipStages } from '../constants/tiers';
import InvestorLayout from '../components/InvestorLayout';
import { createDepositCheckout } from '../api/payments';
import { formatCurrency } from '../utils/currency';

const normaliseDashboardCurrency = (currency) => {
  if (!currency) {
    return 'USD';
  }
  return ['RWF', 'RF'].includes(String(currency).toUpperCase()) ? 'USD' : currency;
};

const normaliseTier = (role) => {
  if (!role) {
    return 'member';
  }
  const match = membershipStages.find((stage) => stage.id === role);
  return match ? match.id : 'member';
};

const formatAmounts = (amounts = []) => {
  if (!amounts.length) {
    return '0';
  }

  return amounts
    .map(({ currency, amount }) => {
      try {
        return formatCurrency(Number(amount || 0), normaliseDashboardCurrency(currency));
      } catch (error) {
        return formatCurrency(Number(amount || 0), 'USD');
      }
    })
    .join(' · ');
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDashboardSnapshot();
      setSnapshot(response);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        navigate('/auth?mode=login', { replace: true });
        return;
      }
      setError(err.message || 'Unable to load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const activeTier = useMemo(
    () => normaliseTier(snapshot?.investor?.role),
    [snapshot?.investor?.role]
  );

  const tierCopy = useMemo(
    () => membershipStages.find((stage) => stage.id === activeTier),
    [activeTier]
  );

  const depositInfo = snapshot?.membership?.deposit || {};
  const depositPaid = depositInfo.paid;
  const investorRole = snapshot?.investor?.role;
  const eligibleForInvestorActions = Boolean(investorRole) && investorRole !== 'member';
  const totalInvested = formatAmounts(snapshot?.summary?.totalInvested);
  const totalReturns = formatAmounts(snapshot?.summary?.totalReturns);
  const investmentPlan = snapshot?.investmentPlan || [];

  const investorName = snapshot?.investor?.fullName || snapshot?.investor?.email || 'Member';
  const greetingName = investorName.split(' ')[0];

  const translatedHeadline = snapshot?.membership?.headline || 'Your Urban Evolution Group hub';
  const translatedMessage = snapshot?.membership?.message || '';

  const translatedActionMessage = [actionMessage];

  const availableGroupDescriptions = useMemo(
    () => (snapshot?.availableGroups || []).map((group) => group.description || ''),
    [snapshot?.availableGroups],
  );
  const translatedGroupDescriptions = availableGroupDescriptions;

  const projectSubtitles = useMemo(
    () =>
      (snapshot?.featuredProjects || []).map(
        (project) => `${project.location || ''} - ${project.group || 'Community project'}`,
      ),
    [snapshot?.featuredProjects],
  );
  const translatedProjectSubtitles = projectSubtitles;

  const handleQuickAction = (action) => {
    setPayError(null);
    if (action.requiresDeposit && !depositPaid) {
      setActionMessage('Settle the refundable $100,000 commitment fee to unlock this action.');
      return;
    }
    if (action.requiresInvestor && !eligibleForInvestorActions) {
      setActionMessage('Complete onboarding to unlock this action.');
      return;
    }
    setActionMessage(null);
    action.onClick();
  };

  const handleDeposit = async (provider = 'stripe') => {
    setPayError(null);
    setPaying(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { checkout_url: url } = await createDepositCheckout({
        provider,
        successUrl: `${origin}/dashboard`,
        cancelUrl: `${origin}/dashboard`,
      });
      if (url) {
        window.location.href = url;
      } else {
        setPayError('Unable to start checkout right now.');
      }
    } catch (err) {
      setPayError(err.message || 'Unable to start checkout right now.');
    } finally {
      setPaying(false);
    }
  };

  const quickActions = [
    {
      // label: 'Create New Group',
      // requiresInvestor: false,
      // requiresDeposit: true,
      // onClick: () => navigate('/groups/create'),
    },
    {
      label: 'Browse Properties',
      requiresInvestor: false,
      requiresDeposit: false,
      onClick: () => navigate('/plots'),
    },
    {
      label: 'Pay $100,000 Deposit',
      requiresInvestor: false,
      requiresDeposit: false,
      onClick: () => handleDeposit('stripe'),
    },
    {
      label: 'Pay $100,000 Deposit (Flutterwave)',
      requiresInvestor: false,
      requiresDeposit: false,
      onClick: () => handleDeposit('flutterwave'),
    },
  ];

  return (
    <InvestorLayout active="dashboard">
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-card">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium">Preparing your investment dashboard...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
            <p className="text-base font-semibold text-slate-900">We ran into an issue</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={loadSnapshot}
              className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-cozy ease-cozy hover:bg-primary/90"
            >
              Retry loading dashboard
            </button>
          </div>
        </div>
      ) : (
        <>
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-primary p-8 text-white shadow-card lg:col-span-2">
            <p className="text-sm font-medium uppercase tracking-widest text-white/80">
              Welcome back, {greetingName}
            </p>
            <h1 className="mt-3 text-2xl font-semibold lg:text-3xl capitalize">
              {translatedHeadline}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90">{translatedMessage}</p>
            <div className="mt-3 inline-flex items-center gap-3 rounded-pill bg-white/10 px-3 py-2 text-xs font-semibold">
              <span
                className={clsx(
                  'rounded-pill px-3 py-1',
                  depositPaid ? 'bg-emerald-500/20 text-emerald-50' : 'bg-amber-400/20 text-amber-50',
                )}
              >
                {depositPaid ? 'Engagement fee paid (refundable after first installment)' : 'Engagement fee pending'}
              </span>
              {!depositPaid ? <span className="text-white/80">Pay within 30 days to unlock investor actions.</span> : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              {/* <
                type="button"
                onClick={() => handleQuickAction(quickActions[0])}
                className="inline-flex items-center justify-center rounded-pill bg-white px-5 py-2 text-sm font-semibold text-primary shadow-sm transition duration-cozy ease-cozy hover:bg-white/90"
              >
                {/* Create New Group */}
              
              <button
                type="button"
                onClick={() => handleQuickAction(quickActions[1])}
                className="inline-flex items-center justify-center rounded-pill border border-white/40 px-5 py-2 text-sm font-semibold text-white transition duration-cozy ease-cozy hover:bg-white/10"
              >
                Browse Plots
              </button>
              {!depositPaid ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickAction(quickActions[2])}
                    disabled={paying}
                    className="inline-flex items-center justify-center rounded-pill bg-sunshine px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-sunshine/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {paying ? 'Starting checkout...' : 'Pay with Card (Stripe)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeposit('flutterwave')}
                    disabled={paying}
                    className="inline-flex items-center justify-center rounded-pill border border-white/60 px-4 py-2 text-xs font-semibold text-white transition duration-cozy ease-cozy hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {paying ? '...' : 'Pay with Local Phone (Flutterwave)'}
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center rounded-pill bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-50">
                  Engagement fee settled
                </span>
              )}
            </div>
            {actionMessage ? (
              <p className="mt-4 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-sunshine">
                {translatedActionMessage?.[0] || actionMessage}
              </p>
            ) : payError ? (
              <p className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {payError}
              </p>
            ) : null}
            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Commitment deposit status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span
                  className={clsx(
                    'inline-flex items-center rounded-pill px-3 py-1 font-semibold',
                    depositPaid ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'
                  )}
                >
                  {depositPaid ? 'Paid' : 'Pending'}
                </span>
                <span className="text-white/80">
                  Required: {formatCurrency(depositInfo.requiredAmountRwf)} ·{' '}
                  {depositPaid
                    ? `On file: ${formatAmounts(depositInfo.totals)}`
                    : 'Secure the refundable $100,000 deposit to unlock investments.'}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white/80 p-6 shadow-card backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Membership Path</p>
            <p className="text-lg font-semibold text-slate-900">You are a {tierCopy?.label}</p>
            <p className="mt-2 text-sm text-slate-500">{tierCopy?.description}</p>
            <MembershipStatusBar activeStage={activeTier} className="mt-5" />
          </div>
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl bg-white p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total Invested</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{totalInvested}</p>
            <p className="mt-2 text-xs text-slate-500">Funds you have committed across projects.</p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Active Groups</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {snapshot?.summary?.activeGroups ?? 0}
            </p>
            <p className="mt-2 text-xs text-slate-500">Collaborative circles you currently belong to.</p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Total Returns</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{totalReturns}</p>
            <p className="mt-2 text-xs text-slate-500">Income generated from active investments.</p>
          </article>
          <article className="rounded-3xl bg-white p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Properties</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {snapshot?.summary?.properties?.participating ?? 0}
              <span className="text-sm font-medium text-slate-500">
                {' '}
                / {snapshot?.summary?.properties?.available ?? 0} available
              </span>
            </p>
            <p className="mt-2 text-xs text-slate-500">Your footprint in the current project pipeline.</p>
          </article>
        </section>

        <section className="mt-12 grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Recent Investments</p>
                <span className="text-xs font-medium text-primary">Active · Funding · Completed</span>
              </div>
              <div className="mt-6 space-y-5">
                {(snapshot?.recentInvestments || []).length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No investments yet. Secure your deposit and explore properties to get started.
                  </p>
                )}
                {(snapshot?.recentInvestments || []).map((investment) => (
                  <article
                    key={investment.id}
                    className="rounded-2xl border border-slate-100 p-5 transition duration-cozy ease-cozy hover:border-primary/30 hover:shadow-card"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{investment.projectName}</p>
                        <p className="text-xs text-slate-500">
                          {investment.groupName ? `${investment.groupName} · ` : ''}
                          {investment.planLabel}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          'inline-flex items-center self-start rounded-pill px-3 py-1 text-xs font-semibold',
                          investment.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : investment.status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : investment.status === 'pending'
                            ? 'bg-amber-400/10 text-amber-600'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {investment.statusLabel}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">Committed</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatAmounts([{ currency: investment.currency, amount: investment.committedAmount }])}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">Returns</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600">
                          {formatAmounts(investment.returns)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">Progress</p>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-primary transition-all duration-cozy ease-cozy"
                            style={{ width: `${investment.progressPercent}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{investment.progressPercent}% funded</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {investmentPlan.length ? (
              <div className="rounded-3xl bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-slate-900">Your Investment Plan</p>
                  <span className="text-xs font-medium text-primary">Unit ownership tracker</span>
                </div>
                <div className="mt-5 space-y-4">
                  {investmentPlan.map((plan) => {
                    const progress =
                      plan.installmentsTarget > 0
                        ? Math.min(100, Math.round((plan.installmentsPaid / plan.installmentsTarget) * 100))
                        : 0;
                    return (
                      <article
                        key={plan.groupId}
                        className="rounded-2xl border border-slate-100 p-5 transition duration-cozy ease-cozy hover:border-primary/30 hover:shadow-card"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              #{plan.groupCode} · {plan.groupName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {plan.totalUnits} units · Building cost {formatCurrency(plan.buildingCost)}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {plan.installmentsPaid}/{plan.installmentsTarget} installments
                          </span>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500">Your unit share</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {formatCurrency(plan.memberShare)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500">Building cost</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {formatCurrency(plan.buildingCost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500">Progress</p>
                            <div className="mt-2 h-2 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-primary transition-all duration-cozy ease-cozy"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{progress}% toward Platinum</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Available Groups</p>
                <span className="text-xs font-medium text-primary">Suggested for you</span>
              </div>
              <div className="mt-5 space-y-4">
                {(snapshot?.availableGroups || []).length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    You are a member of the Urban Evolution Group through TURANEZA App. New circles will appear here when launched.
                  </p>
                )}
              {(snapshot?.availableGroups || []).map((group, index) => (
                <div
                  key={group.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-100 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {translatedGroupDescriptions?.[index] || group.description}
                    </p>
                  </div>
                  <span className="mt-3 inline-flex items-center rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:mt-0">
                    {group.members} members
                  </span>
                </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-slate-900">Featured Projects</p>
                <span className="text-xs font-medium text-primary">Now funding</span>
              </div>
              <div className="mt-5 space-y-4">
                {(snapshot?.featuredProjects || []).length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No highlighted projects at the moment. Check back soon.
                  </p>
                )}
                {(snapshot?.featuredProjects || []).map((project, index) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-slate-100 p-5 transition duration-cozy ease-cozy hover:border-primary/30 hover:shadow-card"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500">
                          {translatedProjectSubtitles?.[index] ||
                            `${project.location || ''} - ${project.group || 'Community project'}`}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {project.statusLabel}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">Funding goal</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatAmounts([{ currency: project.currency, amount: project.fundingGoal }])}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">Committed</p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {formatAmounts([{ currency: project.currency, amount: project.currentValue }])}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">Progress</p>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-primary transition-all duration-cozy ease-cozy"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{project.progressPercent}% reached</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-900">Recent Activity</p>
              <button
                type="button"
                className="text-xs font-semibold text-primary transition duration-cozy ease-cozy hover:text-primary/80"
                >
                  View All
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {(snapshot?.recentActivity || []).length === 0 && (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No activity yet. Updates from payments, groups, and projects will land here.
                  </p>
                )}
                {(snapshot?.recentActivity || []).map((activity) => (
                  <div key={activity.id} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activity.group ? `${activity.group} · ` : ''}
                      {activity.project || 'General update'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(activity.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-card">
              <p className="text-base font-semibold text-slate-900">Quick Actions</p>
              <p className="mt-1 text-sm text-slate-500">
                Jump into frequent tools. Items will unlock as more modules go live.
              </p>
              <div className="mt-4 space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    className="w-full rounded-pill bg-primary/10 px-4 py-2 text-left text-sm font-semibold text-primary transition duration-cozy ease-cozy hover:bg-primary/20"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
        </>
      )}
    </InvestorLayout>
  );
};

export default DashboardPage;
