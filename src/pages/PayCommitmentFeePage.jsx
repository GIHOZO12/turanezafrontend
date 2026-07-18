import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import InvestorLayout from '../components/InvestorLayout';
import { fetchGroupApplicationById, submitCommitmentFeeProof } from '../api/groups';
import { fetchCurrentUser } from '../api/users';
import { formatCurrency } from '../utils/currency';

const PayCommitmentFeePage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [application, setApplication] = useState(null);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchCurrentUser()
      .then((response) => {
        if (mounted) setUser(response);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoadingUser(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loadingUser && !user) {
      const nextPath = encodeURIComponent(`/applications/${applicationId}/pay-commitment-fee`);
      navigate(`/auth?next=${nextPath}`, { replace: true });
    }
  }, [loadingUser, user, applicationId, navigate]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingApplication(true);
      setLoadError(null);
      try {
        const response = await fetchGroupApplicationById(applicationId);
        if (mounted) {
          setApplication(response);
        }
      } catch (error) {
        if (mounted) {
          setLoadError(error.message || 'Unable to load this application.');
        }
      } finally {
        if (mounted) {
          setLoadingApplication(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [applicationId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!proofFile) {
      setSubmitError('Attach a screenshot of your payment confirmation.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = new FormData();
      payload.append('commitment_fee_proof', proofFile);
      const updated = await submitCommitmentFeeProof(applicationId, payload);
      setApplication(updated);
      setSubmitted(true);
      setModalOpen(false);
    } catch (error) {
      setSubmitError(error.message || 'Unable to submit your payment proof right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser || loadingApplication) {
    return (
      <InvestorLayout active="plots">
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Loading...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (loadError || !application) {
    return (
      <InvestorLayout active="plots">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-rose-700">{loadError || 'Application not found.'}</p>
          <Link to="/plots" className="mt-4 inline-block text-sm font-semibold text-primary underline">
            Back to plots
          </Link>
        </div>
      </InvestorLayout>
    );
  }

  const alreadySubmitted = Boolean(application.commitment_fee_proof);

  return (
    <InvestorLayout active="plots">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Join request #{application.application_number?.slice(0, 8)}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pay your commitment fee</h1>
        <p className="mt-2 text-sm text-slate-600">
          Before your request can be reviewed, please pay the commitment fee via mobile money and upload proof
          of payment below.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Amount to pay</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {formatCurrency(application.commitment_fee_amount_rwf, 'RWF', { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">Pay to MoMo code</p>
            <p className="mt-1 text-3xl font-bold tracking-widest text-slate-900">*182*8*1*{application.momo_payment_code}#</p>
          </div>

          <ol className="mt-6 space-y-2 text-sm text-slate-600">
            <li>1. Dial your mobile money USSD code and send the amount above to the code shown.</li>
            <li>2. Save the confirmation SMS/screenshot you receive.</li>
            <li>3. Click "Upload proof of payment" below and attach the screenshot.</li>
          </ol>

          {submitted || alreadySubmitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Payment proof submitted. Our team will verify it and review your request.
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-2 block text-xs font-semibold text-primary underline"
              >
                Submit a different proof
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 w-full rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Upload proof of payment
            </button>
          )}
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Upload proof of payment</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Close</span>
              </button>
            </div>

            {submitError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {submitError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="momo-proof">
                  Screenshot of payment confirmation
                </label>
                <input
                  id="momo-proof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setProofFile((e.target.files && e.target.files[0]) || null)}
                  className="mt-2 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
              >
                {submitting ? 'Submitting...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </InvestorLayout>
  );
};

export default PayCommitmentFeePage;
