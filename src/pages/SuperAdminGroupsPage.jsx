import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  fetchSuperAdminGroups,
  fetchSuperAdminGroup,
  fetchSuperAdminMe,
  freezeSuperAdminGroup,
  unfreezeSuperAdminGroup,
  suspendSuperAdminGroup,
  addGroupInvestor,
  removeGroupInvestor,
  replaceGroupAdmin,
  unmarkGroupAdmin,
  postGroupAnnouncement,
} from '../api/superadmin';
import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'inactive':
      return 'bg-amber-100 text-amber-700';
    case 'archived':
      return 'bg-rose-100 text-rose-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const SuperAdminGroupsPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const hasInitialSelection = useRef(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const data = await fetchSuperAdminGroups();
      const list = Array.isArray(data) ? data : data.results || [];
      setGroups(list);
      if (list.length && !hasInitialSelection.current) {
        const detail = await fetchSuperAdminGroup(list[0].id);
        setSelected(detail);
        hasInitialSelection.current = true;
      }
    } catch (err) {
      setError(err.message || 'Unable to load groups.');
      if (err?.status === 401 || err?.status === 403) {
        navigate('/super-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups.filter((group) => `${group.name} ${group.reference_code}`.toLowerCase().includes(q));
  }, [groups, query]);

  const selectGroup = async (id) => {
    setActionId(id);
    try {
      const detail = await fetchSuperAdminGroup(id);
      setSelected(detail);
    } catch (err) {
      setError(err.message || 'Unable to load group detail.');
    } finally {
      setActionId(null);
    }
  };

  const handleFreeze = async (id) => {
    setActionId(id);
    try {
      await freezeSuperAdminGroup(id, { reason: reasonNote });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to freeze group.');
    } finally {
      setActionId(null);
    }
  };

  const handleUnfreeze = async (id) => {
    setActionId(id);
    try {
      await unfreezeSuperAdminGroup(id, { reason: reasonNote });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to unfreeze group.');
    } finally {
      setActionId(null);
    }
  };

  const handleSuspend = async (id) => {
    setActionId(id);
    try {
      await suspendSuperAdminGroup(id, { reason: reasonNote });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to suspend group.');
    } finally {
      setActionId(null);
    }
  };

  const handleAnnouncement = async () => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await postGroupAnnouncement(selected.id, { body: actionNote, reason: reasonNote });
      setActionNote('');
      await selectGroup(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to post announcement.');
    } finally {
      setActionId(null);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await replaceGroupAdmin(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to make this member the group admin.');
    } finally {
      setActionId(null);
    }
  };

  const handleUnmarkAdmin = async (userId) => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await unmarkGroupAdmin(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to remove this member\'s admin role.');
    } finally {
      setActionId(null);
    }
  };

  const handleAddInvestor = async () => {
    if (!selected) return;
    const userId = prompt('Enter investor user ID');
    if (!userId) return;
    setActionId(selected.id);
    try {
      await addGroupInvestor(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to add investor.');
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveInvestor = async (userId) => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await removeGroupInvestor(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to remove investor.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <SuperAdminShell title="Groups" subtitle="Super Admin">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Group directory</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
              placeholder="Search groups..."
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-6 text-sm text-slate-500">Loading groups...</div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => selectGroup(group.id)}
                  className={clsx(
                    'w-full rounded-2xl border px-4 py-3 text-left transition',
                    selected?.id === group.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-100 bg-white hover:border-primary/40',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        Code: {group.reference_code || 'N/A'} · Members: {group.members_count}
                      </p>
                    </div>
                    <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(group.status)}`}>
                      {group.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Pending apps: {group.pending_applications} · Overdue installments: {group.overdue_installments}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Group Health</p>
                  <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-xs text-slate-500">Admin: {selected.created_by_name || 'N/A'}</p>
                </div>
                <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(selected.status)}`}>
                  {selected.status}
                </span>
              </div>

              <div className="grid gap-4 text-xs text-slate-500 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Committed</p>
                  <p>{selected.health?.total_committed || selected.total_committed}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Paid</p>
                  <p>{selected.health?.total_paid || '0'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Pending apps</p>
                  <p>{selected.health?.pending_applications || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Overdue installments</p>
                  <p>{selected.health?.overdue_installments || 0}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => handleFreeze(selected.id)}
                  disabled={actionId === selected.id}
                  className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  Freeze investments
                </button>
                <button
                  type="button"
                  onClick={() => handleUnfreeze(selected.id)}
                  disabled={actionId === selected.id}
                  className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  Unfreeze
                </button>
                <button
                  type="button"
                  onClick={() => handleSuspend(selected.id)}
                  disabled={actionId === selected.id}
                  className="rounded-pill bg-rose-500 px-3 py-2 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                >
                  Suspend group
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Reason (optional)</p>
                <input
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  className="mt-3 w-full rounded-pill border border-slate-200 px-3 py-2 text-xs"
                  placeholder="Reason for this action (freeze, suspend, replace, move...)"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Official announcement</p>
                <textarea
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Send an official guidance message to the group"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAnnouncement}
                  disabled={!actionNote || actionId === selected.id}
                  className="mt-3 rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  Post announcement
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Active investors</p>
                  <button
                    type="button"
                    onClick={handleAddInvestor}
                    className="rounded-pill border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    Add investor
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">Choose a member below to make them this group's admin.</p>
                <div className="mt-3 space-y-2 text-xs">
                  {selected.active_members?.length ? (
                    selected.active_members.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-700">
                            {member.name}{' '}
                            {member.role === 'admin' ? (
                              <span className="ml-1 rounded-pill bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Admin
                              </span>
                            ) : null}
                          </p>
                          <p className="text-slate-400">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' ? (
                            member.id === selected.created_by ? (
                              <span
                                title="Make someone else admin to reassign group ownership."
                                className="rounded-pill bg-slate-200 px-3 py-1 font-semibold text-slate-500"
                              >
                                Group owner
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUnmarkAdmin(member.id)}
                                disabled={actionId === selected.id}
                                className="rounded-pill border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Unmark admin
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakeAdmin(member.id)}
                              disabled={actionId === selected.id}
                              className="rounded-pill bg-slate-900 px-3 py-1 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Make admin
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveInvestor(member.id)}
                            className="rounded-pill border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No active members loaded.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a group to view details.</p>
          )}
        </section>
      </div>
    </SuperAdminShell>
  );
};

export default SuperAdminGroupsPage;
