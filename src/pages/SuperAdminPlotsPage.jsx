import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  approvePlotJoinRequest,
  approvePlotSubmission,
  createGroupForPlot,
  fetchPlotJoinRequests,
  fetchPlotSubmissionsForReview,
  fetchSuperAdminMe,
  previewJoinRequestCommitmentFeeProof,
  previewJoinRequestCriminalRecord,
  previewJoinRequestProofOfFunds,
  previewPlotOwnershipProof,
  rejectPlotJoinRequest,
  rejectPlotSubmission,
} from '../api/superadmin';
import { Link, useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-600',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const LAND_REGISTRATION_STATUS_OPTIONS = [
  { value: 'titled', label: 'Titled (registered land)' },
  { value: 'leasehold', label: 'Leasehold' },
  { value: 'family_land', label: 'Family/inherited land (untitled)' },
  { value: 'pending_registration', label: 'Registration in progress' },
  { value: 'other', label: 'Other' },
];

const defaultGroupForm = {
  name: '',
  max_members: '15',
  min_investment: '10000',
  total_units: '10',
  building_cost: '300000',
  land_registration_status: '',
  proposed_house_description: '',
};

const SuperAdminPlotsPage = () => {
  const navigate = useNavigate();
  const [plots, setPlots] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [plotStatusFilter, setPlotStatusFilter] = useState('');
  const [joinStatusFilter, setJoinStatusFilter] = useState('');
  const [reason, setReason] = useState('');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [selectedJoinRequest, setSelectedJoinRequest] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState(defaultGroupForm);
  const [groupFormError, setGroupFormError] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const plotsQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (plotStatusFilter) params.set('status', plotStatusFilter);
    return `?${params.toString()}`;
  }, [plotStatusFilter]);

  const joinQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (joinStatusFilter) params.set('status', joinStatusFilter);
    return `?${params.toString()}`;
  }, [joinStatusFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const [plotsData, joinData] = await Promise.all([
        fetchPlotSubmissionsForReview(plotsQuery),
        fetchPlotJoinRequests(joinQuery),
      ]);
      setPlots(Array.isArray(plotsData) ? plotsData : plotsData.results || []);
      setJoinRequests(Array.isArray(joinData) ? joinData : joinData.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load plot submissions.');
      if (err?.status === 401 || err?.status === 403) {
        navigate('/super-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, plotsQuery, joinQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const openDocument = async (fetcher, id, errorMessage) => {
    try {
      const blob = await fetcher(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setError(err.message || errorMessage);
    }
  };

  const openOwnershipProof = (id) => openDocument(previewPlotOwnershipProof, id, 'Unable to open ownership proof.');
  const openProofOfFunds = (id) => openDocument(previewJoinRequestProofOfFunds, id, 'Unable to open proof of funds.');
  const openCriminalRecord = (id) => openDocument(previewJoinRequestCriminalRecord, id, 'Unable to open criminal record.');
  const openCommitmentFeeProof = (id) =>
    openDocument(previewJoinRequestCommitmentFeeProof, id, 'Unable to open commitment fee proof.');

  const handleApprovePlot = async (id) => {
    try {
      await approvePlotSubmission(id, { reason });
      setReason('');
      setSelectedPlot(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to approve plot.');
    }
  };

  const handleRejectPlot = async (id) => {
    try {
      await rejectPlotSubmission(id, { reason });
      setReason('');
      setSelectedPlot(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to reject plot.');
    }
  };

  const handleGroupFormChange = (event) => {
    const { name, value } = event.target;
    setGroupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateGroup = async (id) => {
    setCreatingGroup(true);
    setGroupFormError(null);
    try {
      const updated = await createGroupForPlot(id, {
        name: groupForm.name.trim(),
        max_members: Number(groupForm.max_members),
        min_investment: Number(groupForm.min_investment),
        total_units: Number(groupForm.total_units),
        building_cost: Number(groupForm.building_cost),
        land_registration_status: groupForm.land_registration_status,
        proposed_house_description: groupForm.proposed_house_description.trim(),
      });
      setGroupForm(defaultGroupForm);
      setSelectedPlot(updated);
      await load();
    } catch (err) {
      let message = err.message || 'Unable to create group.';
      if (err.payload && typeof err.payload === 'object') {
        const firstEntry = Object.values(err.payload)[0];
        message = Array.isArray(firstEntry) ? firstEntry[0] : firstEntry || message;
      }
      setGroupFormError(message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleApproveJoinRequest = async (id) => {
    try {
      await approvePlotJoinRequest(id, { reason });
      setReason('');
      setSelectedJoinRequest(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to approve join request.');
    }
  };

  const handleRejectJoinRequest = async (id) => {
    try {
      await rejectPlotJoinRequest(id, { reason });
      setReason('');
      setSelectedJoinRequest(null);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to reject join request.');
    }
  };

  return (
    <SuperAdminShell title="Plots" subtitle="Super Admin">
      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Plot submissions</h3>
          <select
            value={plotStatusFilter}
            onChange={(e) => setPlotStatusFilter(e.target.value)}
            className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="py-6 text-sm text-slate-600">Loading plot submissions...</div>
        ) : (
          <div className="mt-4 space-y-3">
            {plots.length ? (
              plots.map((plot) => (
                <div
                  key={plot.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {plot.group_name || 'Untitled plot (group not yet created)'} · {plot.plot_location}
                    </p>
                    <p className="text-xs text-slate-500">
                      {plot.submitted_by_name || plot.submitted_by_email} · {plot.plot_size_sqm} m&sup2; · UPI{' '}
                      {plot.land_title_number || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-pill px-3 py-1 font-semibold ${statusBadge(plot.status)}`}>{plot.status}</span>
                    {plot.status === 'approved' && !plot.group ? (
                      <span className="rounded-pill bg-sky-100 px-3 py-1 font-semibold text-sky-700">Needs group</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlot(plot);
                        setReason(plot.review_notes || '');
                        setGroupForm(defaultGroupForm);
                        setGroupFormError(null);
                      }}
                      className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No plot submissions found.</p>
            )}
          </div>
        )}
      </div>

      {selectedPlot ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Review plot: {selectedPlot.group_name || `Plot in ${selectedPlot.plot_location}`}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedPlot.submitted_by_name || selectedPlot.submitted_by_email} · {selectedPlot.plot_location} · UPI{' '}
                {selectedPlot.land_title_number || '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlot(null)}
              className="rounded-pill border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Close
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">{selectedPlot.description}</p>
          <p className="mt-1 text-xs text-slate-400">
            Approving does not create a group automatically — you'll create it separately below once approved, and the
            owner ({selectedPlot.submitted_by_name || selectedPlot.submitted_by_email}) will be added as a regular member.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => openOwnershipProof(selectedPlot.id)}
              className="rounded-pill bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              View ownership proof
            </button>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reviewer notes / reason"
            rows={3}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleRejectPlot(selectedPlot.id)}
              className="rounded-pill bg-rose-500 px-4 py-2 font-semibold text-white transition hover:bg-rose-600"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => handleApprovePlot(selectedPlot.id)}
              className="rounded-pill bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
            >
              Approve
            </button>
          </div>

          {selectedPlot.status === 'approved' && !selectedPlot.group ? (
            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-900">Create the investment group</p>
              <p className="mt-1 text-xs text-sky-700">
                Set the group's terms below. The owner will be added as a regular member once it's created — other
                investors can then request to join.
              </p>
              {groupFormError ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {groupFormError}
                </div>
              ) : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Group name</label>
                  <input
                    name="name"
                    value={groupForm.name}
                    onChange={handleGroupFormChange}
                    placeholder="Kimironko Family Plot"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Land registration status
                  </label>
                  <select
                    name="land_registration_status"
                    value={groupForm.land_registration_status}
                    onChange={handleGroupFormChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select status
                    </option>
                    {LAND_REGISTRATION_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max members</label>
                  <input
                    name="max_members"
                    type="number"
                    min={3}
                    max={500}
                    value={groupForm.max_members}
                    onChange={handleGroupFormChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min investment (RWF)</label>
                  <input
                    name="min_investment"
                    type="number"
                    min={0}
                    value={groupForm.min_investment}
                    onChange={handleGroupFormChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Number of units/homes</label>
                  <input
                    name="total_units"
                    type="number"
                    min={1}
                    value={groupForm.total_units}
                    onChange={handleGroupFormChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Construction cost required (RWF)
                  </label>
                  <input
                    name="building_cost"
                    type="number"
                    min={1}
                    value={groupForm.building_cost}
                    onChange={handleGroupFormChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    House to be constructed
                  </label>
                  <textarea
                    name="proposed_house_description"
                    value={groupForm.proposed_house_description}
                    onChange={handleGroupFormChange}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={
                  creatingGroup ||
                  !groupForm.name.trim() ||
                  !groupForm.land_registration_status ||
                  !groupForm.proposed_house_description.trim()
                }
                onClick={() => handleCreateGroup(selectedPlot.id)}
                className="mt-4 rounded-pill bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
              >
                {creatingGroup ? 'Creating group…' : 'Create group'}
              </button>
            </div>
          ) : null}

          {selectedPlot.group ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
              Group "{selectedPlot.group_name}" already created for this plot. Manage its members and admin from the{' '}
              <Link to="/super-admin/groups" className="font-semibold underline">
                Groups
              </Link>{' '}
              page.
            </div>
          ) : null}
        </div>
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Join requests</h3>
          <select
            value={joinStatusFilter}
            onChange={(e) => setJoinStatusFilter(e.target.value)}
            className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="py-6 text-sm text-slate-600">Loading join requests...</div>
        ) : (
          <div className="mt-4 space-y-3">
            {joinRequests.length ? (
              joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.user_name || request.user_email} · {request.plot_name || request.group_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {request.occupation} · Submitted {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-pill px-3 py-1 font-semibold ${statusBadge(request.status)}`}>
                      {request.status}
                    </span>
                    {request.application_fee_paid ? (
                      <span className="rounded-pill bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                        Fee paid
                      </span>
                    ) : request.commitment_fee_proof_preview_url ? (
                      <span className="rounded-pill bg-amber-100 px-3 py-1 font-semibold text-amber-700">
                        Fee proof submitted
                      </span>
                    ) : (
                      <span className="rounded-pill bg-slate-100 px-3 py-1 font-semibold text-slate-500">
                        Fee pending
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJoinRequest(request);
                        setReason(request.notes || '');
                      }}
                      className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No join requests found.</p>
            )}
          </div>
        )}
      </div>

      {selectedJoinRequest ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Review request: {selectedJoinRequest.user_name || selectedJoinRequest.user_email}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedJoinRequest.plot_name ? 'Plot' : 'Group'}: {selectedJoinRequest.plot_name || selectedJoinRequest.group_name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedJoinRequest(null)}
              className="rounded-pill border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Close
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Approving adds this applicant as a member of the plot's investment group.
          </p>

          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Commitment fee</p>
              {selectedJoinRequest.application_fee_paid ? (
                <span className="rounded-pill bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Verified &amp; paid
                </span>
              ) : selectedJoinRequest.commitment_fee_proof_preview_url ? (
                <span className="rounded-pill bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                  Proof submitted — awaiting verification
                </span>
              ) : (
                <span className="rounded-pill bg-slate-400 px-3 py-1 text-xs font-semibold text-white">
                  No proof submitted yet
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-emerald-700/70">Amount</dt>
                <dd className="mt-0.5 font-medium text-slate-800">
                  {selectedJoinRequest.commitment_fee_amount_rwf
                    ? `RWF ${Number(selectedJoinRequest.commitment_fee_amount_rwf).toLocaleString()}`
                    : '—'}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => openCommitmentFeeProof(selectedJoinRequest.id)}
              disabled={!selectedJoinRequest.commitment_fee_proof_preview_url}
              className="mt-3 rounded-pill bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {selectedJoinRequest.commitment_fee_proof_preview_url
                ? 'View proof of payment'
                : 'No proof uploaded'}
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs sm:grid-cols-3">
            {[
              ['Full name', selectedJoinRequest.name],
              ['Email', selectedJoinRequest.email],
              ['Phone', selectedJoinRequest.phone_number],
              ['Location', selectedJoinRequest.location],
              ['Age', selectedJoinRequest.age ?? '—'],
              ['Gender', selectedJoinRequest.gender_label],
              ['Occupation', selectedJoinRequest.occupation_label],
              ['ID / Passport number', selectedJoinRequest.id_number],
              ['Has invested before', selectedJoinRequest.has_experience ? 'Yes' : 'No'],
              ['Funds available now', selectedJoinRequest.financial_ready ? 'Yes' : 'No'],
              ['Understands commitment', selectedJoinRequest.understands_commitment ? 'Yes' : 'No'],
              ['Confirms commitment', selectedJoinRequest.commitment_confirmation ? 'Yes' : 'No'],
              ['Installment plan', selectedJoinRequest.installment_option_label],
              ['Payment deadline', selectedJoinRequest.payment_deadline || '—'],
              ['Has co-investors', selectedJoinRequest.has_co_investors],
              ['Discussed with network', selectedJoinRequest.discussed_with_network],
              ['Comfortable with network', selectedJoinRequest.comfortable_with_network ? 'Yes' : 'No'],
              ['Goal alignment', selectedJoinRequest.goal_alignment],
              ['Preferred communication', (selectedJoinRequest.communication_channels || []).join(', ') || '—'],
              ['Meeting preference', selectedJoinRequest.meeting_preference_label],
              ['Consent acknowledged', selectedJoinRequest.consent_acknowledged ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Motivation</p>
              <p className="mt-1 text-sm text-slate-600">{selectedJoinRequest.motivation || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills / value offered</p>
              <p className="mt-1 text-sm text-slate-600">{selectedJoinRequest.skills || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes on file</p>
              <p className="mt-1 text-sm text-slate-600">{selectedJoinRequest.notes || '—'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => openProofOfFunds(selectedJoinRequest.id)}
              disabled={!selectedJoinRequest.proof_of_funds_preview_url}
              className="rounded-pill bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {selectedJoinRequest.proof_of_funds_preview_url ? 'View proof of funds' : 'No proof of funds uploaded'}
            </button>
            <button
              type="button"
              onClick={() => openCriminalRecord(selectedJoinRequest.id)}
              disabled={!selectedJoinRequest.criminal_record_preview_url}
              className="rounded-pill bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {selectedJoinRequest.criminal_record_preview_url ? 'View criminal record' : 'No criminal record uploaded'}
            </button>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-4 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reviewer notes / reason"
            rows={3}
          />
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleRejectJoinRequest(selectedJoinRequest.id)}
              className="rounded-pill bg-rose-500 px-4 py-2 font-semibold text-white transition hover:bg-rose-600"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => handleApproveJoinRequest(selectedJoinRequest.id)}
              className="rounded-pill bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
            >
              Approve
            </button>
          </div>
        </div>
        </div>
      ) : null}
    </SuperAdminShell>
  );
};

export default SuperAdminPlotsPage;
