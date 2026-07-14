import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApprovedPlots, fetchMemberships } from '../api/groups';
import { fetchCurrentUser } from '../api/users';
import InvestorLayout from '../components/InvestorLayout';
import { formatCurrency } from '../utils/currency';

const normaliseList = (payload) => {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
};

const formatRwf = (amount) => formatCurrency(amount, 'RWF', { maximumFractionDigits: 0 });

const PlotCard = ({ plot, isOwner, membership }) => {
  const progress = plot.funding_progress;
  const isMember = Boolean(membership);

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{plot.plot_location}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{plot.name}</h3>
          </div>
          <span className="shrink-0 rounded-pill bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {isOwner ? 'Your plot' : isMember ? 'Joined' : 'Open for members'}
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-600 line-clamp-3">{plot.proposed_house_description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Plot size</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{plot.plot_size_sqm} m&sup2;</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Land status</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{plot.land_registration_status_label}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Construction cost</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{formatRwf(plot.building_cost)}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-400">Min investment</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{formatRwf(plot.min_investment)}</dd>
          </div>
        </dl>

        {progress ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Contribution progress</span>
              <span className="font-semibold text-slate-700">{progress.percent}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {formatRwf(progress.contributed)} raised of {formatRwf(progress.required)} required
            </p>
          </div>
        ) : null}
      </div>

      {isOwner || isMember ? (
        <Link
          to={`/groups/${plot.group}`}
          className="mt-5 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
        >
          {isOwner ? '  Join group' : ' View group'}
        </Link>
      ) : (
        <Link
          to={`/plots/${plot.id}/join`}
          className="mt-5 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
        >
          Request to join
        </Link>
      )}
    </div>
  );
};

const PlotsPage = () => {
  const [plots, setPlots] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [plotsResponse, membershipsResponse, currentUser] = await Promise.all([
          fetchApprovedPlots(),
          fetchMemberships().catch(() => []),
          fetchCurrentUser().catch(() => null),
        ]);
        if (mounted) {
          setPlots(normaliseList(plotsResponse));
          setMemberships(normaliseList(membershipsResponse));
          setUser(currentUser);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Unable to load available plots right now.');
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

  const membershipIndex = useMemo(() => {
    const map = new Map();
    (memberships || []).forEach((membership) => {
      if (membership?.status === 'active') {
        map.set(membership.group, membership);
      }
    });
    return map;
  }, [memberships]);

  const hasPlots = useMemo(() => plots.length > 0, [plots]);

  return (
    <InvestorLayout active="plots">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Available plots</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Plots approved and ready for collaborators</h1>
            <p className="mt-2 text-sm text-slate-600">
              Every plot here has been verified by our team. Request to join one to help fund and build its house.
            </p>
          </div>
          <Link
            to="/groups/create"
            className="inline-flex items-center gap-2 rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
          >
            Have your own plot? Submit it
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-card">
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p>Loading available plots...</p>
            </div>
          </div>
        ) : hasPlots ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plots.map((plot) => (
              <PlotCard
                key={plot.id}
                plot={plot}
                isOwner={Boolean(user?.id) && plot?.submitted_by?.id === user?.id}
                membership={membershipIndex.get(plot.group)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-card">
            <p className="text-sm font-semibold text-slate-900">No approved plots yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Check back soon, or submit your own plot to get the process started.
            </p>
          </div>
        )}
      </div>
    </InvestorLayout>
  );
};

export default PlotsPage;
