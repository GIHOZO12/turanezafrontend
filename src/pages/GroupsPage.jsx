import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { fetchAllGroups, fetchMemberships } from "../api/groups";
import CreateGroupModal from "../components/CreateGroupModal";
import InvestorLayout, { InvestorContext } from "../components/InvestorLayout";
import { formatCurrency, formatFlexibleCurrency } from "../utils/currency";

const normaliseList = (payload) => {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
};

const formatUsd = (amount) => formatFlexibleCurrency(amount);
const formatUsdValue = (value) => formatCurrency(value);

const resolveCapacityTarget = (group) => {
  const totalUnits = Number(group?.total_units);
  if (Number.isFinite(totalUnits) && totalUnits > 0) {
    return totalUnits;
  }
  const maxMembers = Number(group?.max_members);
  if (Number.isFinite(maxMembers) && maxMembers > 0) {
    return maxMembers;
  }
  return null;
};

const GroupCard = ({ group, membership, onJoin, canJoin, isOwner = false }) => {
  const initials = useMemo(() => {
    if (!group?.name) return "UEG";
    return group.name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [group?.name]);

  const isMember = Boolean(membership);
  const isAdmin = membership?.role === "admin" || isOwner;
  const leadName =
    group?.created_by?.full_name ||
    group?.created_by?.email ||
    "Urban Evolution Group";
  const leadEmail = group?.created_by?.email || "";
  const buildingCostLabel = formatUsdValue(group?.building_cost);
  const unitShareLabel = formatUsdValue(group?.member_unit_share);
  const membersCount = group?.members_count ?? 0;
  const targetSlots = resolveCapacityTarget(group);
  const isFull = Boolean(targetSlots) && membersCount >= targetSlots;
  const capacityLabel = targetSlots
    ? `${membersCount}/${targetSlots}`
    : `${membersCount}`;
  const capacityRatio = targetSlots
    ? Math.min(1, membersCount / targetSlots)
    : null;
  const minInvestmentLabel = formatUsd(group?.min_investment);
  const capitalRaisedValue =
    membersCount * Number(group?.member_unit_share || 0);
  const capitalRaisedLabel = formatUsdValue(capitalRaisedValue);

  return (
    <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-card transition duration-200 ease-in-out hover:border-primary/30 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Link
              to={`/groups/${group.id}`}
              className="text-left text-base font-semibold text-slate-900 hover:text-primary"
            >
              {group.name}
            </Link>
            {isAdmin ? (
              <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {isOwner ? "Creator" : "Admin"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {group.description ||
              "Collaborative investment circle within Urban Evolution Group."}
          </p>
          
         
        </div>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <div>
          <div className="flex items-center justify-between">
            <span>Active investors</span>
            <span className="font-semibold text-slate-900">{capacityLabel}</span>
          </div>
          {capacityRatio !== null ? (
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(capacityRatio * 100, 100)}%` }}
              />
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Status</span>
          <span className="font-semibold text-slate-900">
            {group.status === "active" ? "Open" : "Restricted"}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Min investment</span>
          <span className="font-semibold text-slate-900">{minInvestmentLabel}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Building cost</span>
          <span className="font-semibold text-slate-900">{buildingCostLabel}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Total units</span>
          <span className="font-semibold text-slate-900">{group.total_units || "—"}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Your unit share</span>
          <span className="font-semibold text-slate-900">{unitShareLabel}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span>Capital raised</span>
          <span className="font-semibold text-slate-900">{capitalRaisedLabel}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          to={`/groups/${group.id}`}
          className="rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
        >
          View details
        </Link>
        {isAdmin ? (
          <Link
            to={`/groups/${group.id}/admin`}
            className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
          >
            Admin portal
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => onJoin(group)}
          className={clsx(
            "rounded-pill px-4 py-2 text-xs font-semibold transition duration-150 ease-in-out",
            isMember || isFull || !canJoin
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : "bg-primary text-white hover:bg-primary/90",
          )}
          disabled={isMember || isFull || !canJoin}
        >
          {isMember
            ? "Already joined"
            : isFull
              ? "Group full"
              : !canJoin
                ? "Pay deposit to join"
                : "Join this group"}
        </button>
      </div>
    </article>
  );
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loadingUser } = useContext(InvestorContext);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const isAuthenticated = Boolean(user?.id);
  const depositPaid = Boolean(user?.deposit_paid);

  const membershipIndex = useMemo(() => {
    const map = new Map();
    (memberships || []).forEach((membership) => {
      if (membership?.status === "active") {
        map.set(membership.group, membership);
      }
    });
    return map;
  }, [memberships]);

  const myGroups = useMemo(() => {
    const currentUserId = user?.id;
    return groups.filter(
      (group) =>
        membershipIndex.has(group.id) ||
        (currentUserId && group?.created_by?.id === currentUserId),
    );
  }, [groups, membershipIndex, user?.id]);

  const discoverGroups = useMemo(() => {
    const currentUserId = user?.id;
    return groups.filter(
      (group) =>
        !membershipIndex.has(group.id) &&
        (!currentUserId || group?.created_by?.id !== currentUserId),
    );
  }, [groups, membershipIndex, user?.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allGroups, myMemberships] = await Promise.all([
        fetchAllGroups(),
        fetchMemberships(),
      ]);
      setGroups(normaliseList(allGroups));
      setMemberships(normaliseList(myMemberships));
    } catch (err) {
      setError(err.message || "Unable to load groups at the moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleJoinGroup = (group) => {
    if (!group) {
      return;
    }
    const destination = `/groups/${group.id}/join`;
    if (!isAuthenticated && !loadingUser) {
      navigate(`/auth?next=${encodeURIComponent(destination)}`);
      return;
    }
    setFeedback(null);
    navigate(destination);
  };

  const handleGuideClose = () => {
    setGuideOpen(false);
  };

  const handleGuideProceed = () => {
    setGuideOpen(false);
    navigate("/groups/create");
  };

  const handleGuideOpen = () => {
    setGuideOpen(true);
  };

  if (loading) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Loading investment groups...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <Fragment>
      <InvestorLayout active="groups">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/90 p-6 shadow-card">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Group discovery
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Manage your circles & discover new communities
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Browse vetted investment groups, review membership requirements,
              and collaborate with accredited investors across Kigali and
              secondary cities.
              <br /> <br />
                  Members who pay the RWF 100,000 commitment fee are
              recognised as aspiring investors, and receive onboarding emails
              automatically. They will be able to join any group that fits their
              investment thesis and capacity, and access the dedicated chat and
              governance channels for each. Group administrators review
              applications and may reach out to applicants for additional
              information or onboarding calls before approving membership.
              <br /> <br />
              After joining a group, they will now invest heavily in one, or
              multiple installments to be silver up to platinum membership
              status, and own their unit share apartments respectively.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/investments"
                className="inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
              >
                View investments
              </Link>
              <button
                type="button"
                onClick={handleGuideOpen}
                className="inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
              >
                How creation works
              </button>
            </div>
          </div>
        </section>

        {!depositPaid ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                If your RWF 100,000 commitment deposit has already been
            paid but is not yet reflected, you can still continue with your
            group application while the team verifies it.
          </div>
        ) : null}

        {feedback ? (
          <div
            className={clsx(
              "mt-6 rounded-3xl border px-4 py-4 text-sm",
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-600",
            )}
          >
            {feedback.message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <section className="mt-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">My Groups</p>
              <p className="text-xs text-slate-500">
                You can join multiple groups. Each will surface in your
                dashboard with dedicated chat and governance feeds.
              </p>
            </div>
            <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {myGroups.length} active
            </span>
          </div>
          {myGroups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
              You have not joined any group yet. Submit an application to get
              started.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  membership={membershipIndex.get(group.id)}
                  onJoin={handleJoinGroup}
                  canJoin={true}
                  isOwner={group?.created_by?.id === user?.id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Discover Groups
              </p>
              <p className="text-xs text-slate-500">
                Explore open communities and request to join. Each application
                is reviewed to confirm readiness and alignment with the
                investment thesis.
              </p>
            </div>
            <span className="rounded-pill bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {discoverGroups.length} available
            </span>
          </div>
          {discoverGroups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
              All active groups already include you. New circles will appear
              here once launched.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {discoverGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  membership={undefined}
                  onJoin={handleJoinGroup}
                  canJoin={true}
                  isOwner={group?.created_by?.id === user?.id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-3xl bg-white p-6 shadow-card">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                How joining a group works
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  1. Submit the investor readiness form for the group you
                  prefer.
                </li>
                <li>
                  2. Upload proof of funds and confirm the RWF 100,000
                  commitment fee.
                </li>
                <li>
                  3. On approval you will receive an email confirmation and
                  investor dashboard access.
                </li>
                <li>
                  4. Missed payment deadlines automatically reject the
                  application.
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-primary/5 p-4 text-sm text-slate-600">
              <p className="font-semibold text-primary">
                Heads up for applicants
              </p>
              <p className="mt-2">
                Group administrators and the Urban Evolution Group team review
                every submission. They may invite you to a short onboarding call
                before activating your membership. Keep your contact information
                accurate so we can reach you quickly.
              </p>
            </div>
          </div>
        </section>
      </InvestorLayout>

      <CreateGroupModal
        open={guideOpen}
        onClose={handleGuideClose}
        onProceed={handleGuideProceed}
        userRole={user?.role}
      />
    </Fragment>
  );
};

export default GroupsPage;
