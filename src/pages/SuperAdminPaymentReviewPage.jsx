import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  fetchPaymentProof,
  verifyBankProof,
  approvePaymentProof,
  rejectPaymentProof,
  fetchSuperAdminMe,
} from '../api/superadmin';

const SuperAdminPaymentReviewPage = () => {
  const { proofId } = useParams();
  const navigate = useNavigate();
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [verification, setVerification] = useState({
    bank_name: '',
    branch: '',
    verifier_identifier: '',
    method: 'call',
    outcome: 'matched',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const data = await fetchPaymentProof(proofId);
      setProof(data);
    } catch (err) {
      setError(err.message || 'Unable to load payment proof.');
      navigate('/super-admin/login', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, proofId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async () => {
    setError(null);
    try {
      await verifyBankProof(proofId, verification);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to save verification.');
    }
  };

  const handleApprove = async () => {
    setError(null);
    try {
      await approvePaymentProof(proofId, { new_tier: proof?.tier_requested, reason: note });
      navigate('/super-admin/payments');
    } catch (err) {
      setError(err.message || 'Unable to approve.');
    }
  };

  const handleReject = async () => {
    setError(null);
    try {
      await rejectPaymentProof(proofId, { reason: note || 'Rejected by Super Admin' });
      navigate('/super-admin/payments');
    } catch (err) {
      setError(err.message || 'Unable to reject.');
    }
  };

  return (
    <SuperAdminShell title="Payment Review" subtitle="Super Admin">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-600">Loading proof...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Proof preview</h2>
            <p className="mt-2 text-sm text-slate-500">
              Files are served from a protected preview endpoint to keep deposit proofs private.
            </p>
            {proof?.preview_url ? (
              <iframe
                title="payment proof preview"
                src={proof.preview_url}
                className="mt-4 h-[520px] w-full rounded-2xl border border-slate-200"
              />
            ) : (
              <p className="mt-6 text-sm text-slate-500">No preview available.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Decision</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Investor</span>
                <span className="font-semibold text-slate-900">{proof?.user_name || proof?.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-semibold text-slate-900">
                  {proof?.amount} {proof?.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tier requested</span>
                <span className="font-semibold text-slate-900">{proof?.tier_requested}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-semibold text-slate-900">{proof?.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference</span>
                <span className="font-semibold text-slate-900">{proof?.reference || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Bank verification</h3>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Bank name"
                value={verification.bank_name}
                onChange={(e) => setVerification((prev) => ({ ...prev, bank_name: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Branch"
                value={verification.branch}
                onChange={(e) => setVerification((prev) => ({ ...prev, branch: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Verifier identifier"
                value={verification.verifier_identifier}
                onChange={(e) => setVerification((prev) => ({ ...prev, verifier_identifier: e.target.value }))}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={verification.method}
                  onChange={(e) => setVerification((prev) => ({ ...prev, method: e.target.value }))}
                >
                  <option value="call">Call</option>
                  <option value="visit">Visit</option>
                  <option value="email">Email</option>
                </select>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={verification.outcome}
                  onChange={(e) => setVerification((prev) => ({ ...prev, outcome: e.target.value }))}
                >
                  <option value="matched">Matched</option>
                  <option value="not_found">Not found</option>
                  <option value="mismatch">Mismatch</option>
                </select>
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Verification notes"
                rows={3}
                value={verification.notes}
                onChange={(e) => setVerification((prev) => ({ ...prev, notes: e.target.value }))}
              />
              <button
                type="button"
                onClick={handleVerify}
                className="w-full rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
              >
                Save verification
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Decision notes</h3>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Notes for approval or rejection"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="rounded-pill bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="rounded-pill bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                >
                  Approve + promote
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </SuperAdminShell>
  );
};

export default SuperAdminPaymentReviewPage;
