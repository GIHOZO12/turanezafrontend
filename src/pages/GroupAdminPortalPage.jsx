import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import InvestorLayout from '../components/InvestorLayout';
import {
  fetchGroupApplications,
  fetchGroupById,
  fetchGroupMessages,
  fetchMemberships,
  reviewGroupApplication,
} from '../api/groups';
import { fetchCurrentUser } from '../api/users';
import { formatFlexibleCurrency } from '../utils/currency';

const formatUsd = (value) => formatFlexibleCurrency(value);

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

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

const GroupAdminPortalPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [inboxThreads, setInboxThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState({});
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const groupCode = useMemo(
    () => (group ? group.reference_code || String(group.id || '').padStart(5, '0') : '00000'),
    [group],
  );
  const buildingCostLabel = useMemo(() => formatUsd(group?.building_cost), [group?.building_cost]);
  const memberShareLabel = useMemo(() => formatUsd(group?.member_unit_share), [group?.member_unit_share]);
  const membersCount = group?.members_count ?? 0;
  const capacityTarget = useMemo(() => resolveCapacityTarget(group), [group]);
  const capacityLabel = useMemo(
    () => (capacityTarget ? `${membersCount}/${capacityTarget}` : `${membersCount}`),
    [capacityTarget, membersCount],
  );

  const loadPortalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userResponse, groupResponse, membershipResponse, applicationResponse, inboxResponse] = await Promise.all([
        fetchCurrentUser(),
        fetchGroupById(groupId),
        fetchMemberships({ group: groupId }),
        fetchGroupApplications({ group: groupId, status: 'pending' }),
        fetchGroupMessages({ group: groupId, inbox: true }),
      ]);
      setCurrentUser(userResponse);
      setGroup(groupResponse);
      setMembers(normaliseList(membershipResponse));
      setPendingApplications(normaliseList(applicationResponse));
      setInboxThreads(buildThreads(normaliseList(inboxResponse), userResponse?.id));
    } catch (portalError) {
      setError(portalError.message || 'Unable to load admin portal data right now.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      loadPortalData();
    }
  }, [groupId, loadPortalData]);

  const isGroupAdmin = useMemo(() => {
    if (!group || !currentUser) {
      return false;
    }
    if (group.created_by?.id === currentUser.id) {
      return true;
    }
    return members.some(
      (entry) => entry.user?.id === currentUser.id && entry.role === 'admin' && entry.status === 'active',
    );
  }, [group, members, currentUser]);

  const handleReview = async (applicationId, status) => {
    setActionState((prev) => ({ ...prev, [applicationId]: status }));
    try {
      await reviewGroupApplication(applicationId, { status });
      await loadPortalData();
    } catch (reviewError) {
      setError(reviewError.message || 'Unable to update the application right now.');
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[applicationId];
        return next;
      });
    }
  };

  const handleOpenChat = (recipientId) => {
    if (!recipientId) {
      navigate(`/groups/${groupId}/chat`);
      return;
    }
    navigate(`/groups/${groupId}/chat?recipient=${recipientId}`);
  };

  if (loading) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Loading admin portal...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (!isGroupAdmin) {
    return (
      <InvestorLayout active="groups">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-card">
          <p className="text-base font-semibold text-slate-900">Access restricted</p>
          <p className="mt-2 text-sm text-slate-600">
            Only the group creator or delegated admins can manage onboarding and chat requests.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
          >
            Back to group
          </button>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout active="groups">
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Admin portal</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                #{groupCode} · {group?.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Approve investor requests, coordinate onboarding, and answer inquiries from interested members.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="rounded-2xl border border-slate-200 px-4 py-2 text-center">
                <p className="text-2xl font-semibold text-slate-900">{pendingApplications.length}</p>
                <p className="text-xs text-slate-500">Pending applicants</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-2 text-center">
                <p className="text-2xl font-semibold text-slate-900">{capacityLabel}</p>
                <p className="text-xs text-slate-500">Confirmed investors</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-2 text-center">
                <p className="text-2xl font-semibold text-slate-900">#{groupCode}</p>
                <p className="text-xs text-slate-500">Group number</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-2 text-center">
                <p className="text-xl font-semibold text-slate-900">{buildingCostLabel}</p>
                <p className="text-xs text-slate-500">Building cost</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-2 text-center">
                <p className="text-xl font-semibold text-slate-900">{memberShareLabel}</p>
                <p className="text-xs text-slate-500">Unit share</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleOpenChat(null)}
              className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
            >
              Open group chat
            </button>
            <button
              type="button"
              onClick={loadPortalData}
              className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
            >
              Refresh data
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">{error}</div>
        ) : null}

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Waiting list</h2>
              <p className="text-xs text-slate-500">
                Review each request, confirm documentation, and approve when you&apos;re ready to onboard them.
              </p>
            </div>
          </div>
          {pendingApplications.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No pending applications. Encourage prospective investors to submit the form.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingApplications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-card transition duration-150 ease-in-out hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {application.name || application.user?.full_name || application.user?.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {application.email} • {application.location || 'Location TBD'}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      Submitted on <span className="font-semibold">{formatDate(application.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-3">
                    <p>
                      <span className="font-semibold text-slate-900">Occupation:</span> {application.occupation}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">ID:</span> {application.id_number}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Motivation:</span>{' '}
                      {application.motivation?.slice(0, 120) || '—'}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenChat(application.user?.id)}
                      className="rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
                    >
                      Message applicant
                    </button>
                    <button
                      type="button"
                      disabled={actionState[application.id] === 'approved'}
                      onClick={() => handleReview(application.id, 'approved')}
                      className={clsx(
                        'rounded-pill px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out',
                        actionState[application.id] === 'approved'
                          ? 'bg-emerald-400/60 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600',
                      )}
                    >
                      {actionState[application.id] === 'approved' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={actionState[application.id] === 'rejected'}
                      onClick={() => handleReview(application.id, 'rejected')}
                      className={clsx(
                        'rounded-pill px-4 py-2 text-xs font-semibold transition duration-150 ease-in-out',
                        actionState[application.id] === 'rejected'
                          ? 'bg-rose-400/50 text-white'
                          : 'bg-rose-100 text-rose-600 hover:bg-rose-200',
                      )}
                    >
                      {actionState[application.id] === 'rejected' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Direct inquiries</h2>
              <p className="text-xs text-slate-500">
                Respond to applicants and members who messaged you privately. Each tile represents a conversation.
              </p>
            </div>
          </div>
          {inboxThreads.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No direct messages yet. Investors can reach you from the join form.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {inboxThreads.map((thread) => (
                <button
                  type="button"
                  key={thread.user.id}
                  onClick={() => handleOpenChat(thread.user.id)}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-card transition duration-150 ease-in-out hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {thread.user.full_name || thread.user.email}
                      </p>
                      <p className="text-xs text-slate-500">{thread.user.email}</p>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {formatTime(thread.lastMessageAt)}
                    </p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs text-slate-500">{thread.lastMessage}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </InvestorLayout>
  );
};

const normaliseList = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

const buildThreads = (messages, currentUserId) => {
  const map = new Map();
  messages.forEach((message) => {
    const otherParty =
      message.sender?.id === currentUserId ? message.recipient : message.sender;
    if (!otherParty) {
      return;
    }
    const existing = map.get(otherParty.id);
    if (!existing || new Date(message.created_at) > new Date(existing.lastMessageAt)) {
      map.set(otherParty.id, {
        user: otherParty,
        lastMessage: message.body,
        lastMessageAt: message.created_at,
      });
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
  );
};

export default GroupAdminPortalPage;
