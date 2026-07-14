import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  fetchPaymentProofs,
  approvePaymentProof,
  rejectPaymentProof,
  flutterwavePaymentProof,
  fetchSuperAdminMe,
} from '../api/superadmin';

const badgeClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'submitted':
    case 'under_review':
      return 'bg-amber-100 text-amber-700';
    case 'needs_info':
      return 'bg-orange-100 text-orange-700';
    case 'verified_with_bank':
      return 'bg-sky-100 text-sky-700';
    case 'rejected':
    case 'flagged_fraud':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const SuperAdminPaymentsPage = () => {
  const navigate = useNavigate();
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        await fetchSuperAdminMe();
      } catch (err) {
        navigate('/super-admin/login', { replace: true });
      }
    };
    ensureAuth();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPaymentProofs();
      setProofs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load payment proofs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    setActingId(id);
    setActionError(null);
    try {
      await approvePaymentProof(id, { new_tier: 'silver', reason: 'Payment confirmed' });
      await load();
    } catch (err) {
      setActionError(err.message || 'Unable to approve.');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    setActingId(id);
    setActionError(null);
    try {
      await rejectPaymentProof(id, { reason: 'Insufficient proof' });
      await load();
    } catch (err) {
      setActionError(err.message || 'Unable to reject.');
    } finally {
      setActingId(null);
    }
  };

  const handleSetStatus = async (id, status) => {
    setActingId(id);
    setActionError(null);
    try {
      await flutterwavePaymentProof(id, { status });
      await load();
    } catch (err) {
      setActionError(err.message || 'Unable to update status.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <SuperAdminShell title="Payment Proofs" subtitle="Super Admin">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-600">Loading proofs...</div>
      ) : (
        <div className="space-y-4">
          {proofs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
              No payment proofs submitted yet.
            </div>
          ) : (
            proofs.map((proof) => (
              <div key={proof.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{proof.user_name || proof.user_email}</p>
                    <p className="text-xs text-slate-500">
                      {proof.amount} {proof.currency} · Ref: {proof.reference || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">Tier requested: {proof.tier_requested || 'N/A'}</p>
                  </div>
                  <span className={clsx('rounded-pill px-3 py-1 text-xs font-semibold', badgeClass(proof.status))}>
                    {proof.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Link
                    to={`/super-admin/payments/${proof.id}`}
                    className="rounded-pill bg-primary/10 px-3 py-1 font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Review proof
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(proof.id, 'under_review')}
                    disabled={actingId === proof.id}
                    className="rounded-pill border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Mark under review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(proof.id)}
                    disabled={actingId === proof.id}
                    className="rounded-pill bg-emerald-500 px-3 py-1 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Approve + promote
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(proof.id)}
                    disabled={actingId === proof.id}
                    className="rounded-pill bg-rose-500 px-3 py-1 font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </SuperAdminShell>
  );
};

export default SuperAdminPaymentsPage;
