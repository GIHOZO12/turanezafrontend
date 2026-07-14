import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InvestorLayout, { InvestorContext } from '../components/InvestorLayout';
import { legalApi } from '../api/legal';
import {
  fetchComplianceRequirements,
  uploadComplianceRequirement,
  fetchMyComplianceSubmissions,
} from '../api/compliance';

const fallbackDocs = [
  { slug: 'terms', title: 'Terms of Service', current_version: 1, mode: 'OPTIONAL', updated_at: '2026-02-01' },
  { slug: 'privacy', title: 'Privacy Policy', current_version: 1, mode: 'OPTIONAL', updated_at: '2026-02-01' },
  { slug: 'investor-rules', title: 'Investor Rules', current_version: 1, mode: 'SOFT_GATE', updated_at: '2026-02-01' },
  { slug: 'group-rules', title: 'Group Rules', current_version: 1, mode: 'SOFT_GATE', updated_at: '2026-02-01' },
];

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const LegalCompliancePage = () => {
  const { user } = useContext(InvestorContext);
  const [docs, setDocs] = useState([]);
  const [acceptances, setAcceptances] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [uploading, setUploading] = useState({});
  const [complianceAuthRequired, setComplianceAuthRequired] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await legalApi.listDocs();
        if (alive) {
          setDocs(Array.isArray(list) ? list : list?.results || []);
        }
      } catch (err) {
        if (alive) {
          setDocs(fallbackDocs);
        }
      }

      try {
        const reqs = await fetchComplianceRequirements();
        if (alive) {
          setRequirements(Array.isArray(reqs) ? reqs : reqs?.results || []);
          setComplianceAuthRequired(false);
        }
      } catch (err) {
        if (alive) {
          if (err?.status === 401 || err?.status === 403) {
            setComplianceAuthRequired(true);
          }
          setRequirements([]);
        }
      }

      if (user) {
        try {
          const mine = await legalApi.myAcceptances();
          if (alive) {
            setAcceptances(Array.isArray(mine) ? mine : mine?.results || []);
          }
        } catch (err) {
          if (alive) {
            setAcceptances([]);
          }
        }

        try {
          const mine = await fetchMyComplianceSubmissions();
          if (alive) {
            setSubmissions(Array.isArray(mine) ? mine : mine?.results || []);
          }
        } catch (err) {
          if (alive) {
            setSubmissions([]);
          }
        }
      }
      if (alive) {
        setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [user]);

  const requiresAcceptance = useMemo(() => {
    if (!acceptances || !docs.length) return false;
    return acceptances.some((entry) => entry.required && entry.accepted_version !== entry.latest_version);
  }, [acceptances, docs]);

  const statusBadge = (status) => {
    const map = {
      not_uploaded: 'bg-slate-100 text-slate-600',
      submitted: 'bg-amber-100 text-amber-700',
      under_review: 'bg-sky-100 text-sky-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-600',
      needs_info: 'bg-orange-100 text-orange-700',
    };
    return map[status] || map.not_uploaded;
  };

  const handleUpload = async (code, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [code]: true }));
    setError(null);
    try {
      const formData = new FormData();
      formData.append('requirement_code', code);
      formData.append('file', file);
      await uploadComplianceRequirement(formData);
      const reqs = await fetchComplianceRequirements();
      setRequirements(Array.isArray(reqs) ? reqs : reqs?.results || []);
      setComplianceAuthRequired(false);
      const mine = await fetchMyComplianceSubmissions();
      setSubmissions(Array.isArray(mine) ? mine : mine?.results || []);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        setComplianceAuthRequired(true);
      }
      setError(err.message || 'Unable to upload document.');
    } finally {
      setUploading((prev) => ({ ...prev, [code]: false }));
    }
  };

  return (
    <InvestorLayout active="legal">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Legal & Policy Summary</h1>
        <p className="mt-2 text-sm text-slate-500">
          Urban Evolution Group provides a platform for group-led real estate investing. By using this platform, you
          agree to comply with the published rules, meet your payment commitments, and understand what does requires investment.
        </p>
        {requiresAcceptance ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            New required legal updates are available. Please review and accept to continue using key features.
          </div>
        ) : null}
      </div>

      <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
            <p className="text-xs text-slate-500">Lightweight list of the latest published policies.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-sm text-slate-500">Loading documents...</div>
        ) : (
          <div className="mt-4 space-y-3">
            {(docs.length ? docs : fallbackDocs).map((doc) => (
              <div
                key={doc.slug}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                  <p className="text-xs text-slate-500">
                    Version v{doc.current_version} • {doc.mode || 'OPTIONAL'} • Updated {formatDate(doc.updated_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    to={`/legal/docs/${doc.slug}`}
                    className="rounded-pill bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90"
                  >
                    Read
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Investor Verification Documents</h2>
            <p className="text-xs text-slate-500">
              To participate as an investor, upload the required verification documents below.
            </p>
          </div>
        </div>

        {!complianceAuthRequired ? (
          <div className="mt-4 space-y-3">
            {requirements.length ? (
              requirements.map((req) => (
                <div
                  key={req.code}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {req.title?.replace('AML', 'Anti Money Laundering')}
                    </p>
                    <p className="text-xs text-slate-500">Required</p>
                    {req.reviewer_notes ? (
                      <p className="text-xs text-rose-500">Note: {req.reviewer_notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className={`rounded-pill px-3 py-1 font-semibold ${statusBadge(req.status)}`}>
                      {req.status?.replace(/_/g, ' ') || 'not uploaded'}
                    </span>
                    <label className="cursor-pointer rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleUpload(req.code, e.target.files?.[0])}
                        disabled={uploading[req.code]}
                      />
                    </label>
                    {uploading[req.code] ? (
                      <span className="text-xs text-slate-500">Uploading...</span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No compliance requirements configured yet.</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Sign in to upload verification documents.</p>
        )}
      </section>

      {user ? (
        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent uploads</h2>
              <p className="text-xs text-slate-500">Latest verification files you submitted.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {submissions.length ? (
              submissions.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.requirement_title}</p>
                    <p className="text-xs text-slate-500">
                      Submitted {new Date(item.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                    {item.status?.replace(/_/g, ' ') || 'submitted'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No uploads yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {user ? (
        <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900">Your acceptance status</h2>
          <p className="text-xs text-slate-500">We only show your latest acceptance per document.</p>
          <div className="mt-4 space-y-3">
            {(acceptances || []).length ? (
              acceptances.map((item) => {
                const ok = item.accepted_version === item.latest_version;
                return (
                  <div
                    key={item.slug}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        Accepted v{item.accepted_version ?? '—'} • Latest v{item.latest_version} • Required:{' '}
                        {item.required ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <span
                      className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                      }`}
                    >
                      {ok ? 'Up to date' : 'Action needed'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No acceptance records yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}
    </InvestorLayout>
  );
};

export default LegalCompliancePage;
