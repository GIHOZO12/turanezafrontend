import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  approveComplianceSubmission,
  fetchComplianceSubmissions,
  previewComplianceSubmission,
  rejectComplianceSubmission,
  requestInfoComplianceSubmission,
  fetchSuperAdminMe,
} from '../api/superadmin';
import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  const map = {
    submitted: 'bg-amber-100 text-amber-700',
    under_review: 'bg-sky-100 text-sky-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-600',
    needs_info: 'bg-orange-100 text-orange-700',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

const SuperAdminCompliancePage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ status: 'submitted', search: '' });
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    return `?${params.toString()}`;
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const data = await fetchComplianceSubmissions(query);
      setRows(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load compliance submissions.');
      if (err?.status === 401 || err?.status === 403) {
        navigate('/super-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, query]);

  useEffect(() => {
    load();
  }, [load]);

  const openPreview = async (id) => {
    try {
      const blob = await previewComplianceSubmission(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setError(err.message || 'Unable to open preview.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveComplianceSubmission(id, { reason });
      setReason('');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to approve.');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectComplianceSubmission(id, { reason });
      setReason('');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to reject.');
    }
  };

  const handleNeedsInfo = async (id) => {
    try {
      await requestInfoComplianceSubmission(id, { note: reason });
      setReason('');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to request info.');
    }
  };

  return (
    <SuperAdminShell title="Compliance Queue" subtitle="Super Admin">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_info">Needs info</option>
          </select>
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
            placeholder="Search investor or requirement..."
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-6 text-sm text-slate-600">Loading submissions...</div>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.length ? (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {row.user_name || row.user_email} · {row.requirement_title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.requirement_code} · Submitted {new Date(row.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-pill px-3 py-1 font-semibold ${statusBadge(row.status)}`}>
                      {row.status?.replace(/_/g, ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(row);
                        setReason(row.reviewer_notes || '');
                      }}
                      className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No compliance submissions found.</p>
            )}
          </div>
        )}
      </div>

      {selected ? (
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Review submission</h3>
              <p className="text-xs text-slate-500">
                {selected.user_name || selected.user_email} · {selected.requirement_title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-pill border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => openPreview(selected.id)}
              className="rounded-pill bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
            >
              View document
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
              onClick={() => handleNeedsInfo(selected.id)}
              className="rounded-pill border border-amber-200 px-4 py-2 font-semibold text-amber-700 transition hover:border-amber-400"
            >
              Request info
            </button>
            <button
              type="button"
              onClick={() => handleReject(selected.id)}
              className="rounded-pill bg-rose-500 px-4 py-2 font-semibold text-white transition hover:bg-rose-600"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => handleApprove(selected.id)}
              className="rounded-pill bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
            >
              Approve
            </button>
          </div>
        </div>
      ) : null}
    </SuperAdminShell>
  );
};

export default SuperAdminCompliancePage;
