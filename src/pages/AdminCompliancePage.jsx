import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { fetchComplianceChecks, fetchDocuments, updateComplianceCheck } from '../api/compliance';

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
];

const statusBadge = (status) => {
  switch (status) {
    case 'verified':
      return 'bg-emerald-100 text-emerald-700';
    case 'rejected':
      return 'bg-rose-100 text-rose-600';
    default:
      return 'bg-amber-100 text-amber-600';
  }
};

const AdminCompliancePage = () => {
  const [checks, setChecks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [checksResponse, documentsResponse] = await Promise.all([fetchComplianceChecks(), fetchDocuments()]);
      const checkRecords = Array.isArray(checksResponse?.results)
        ? checksResponse.results
        : Array.isArray(checksResponse)
        ? checksResponse
        : [];
      const documentRecords = Array.isArray(documentsResponse?.results)
        ? documentsResponse.results
        : Array.isArray(documentsResponse)
        ? documentsResponse
        : [];
      setChecks(checkRecords);
      setDocuments(documentRecords);
    } catch (err) {
      setError(err.message || 'Unable to load compliance data right now.');
      setChecks([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const verified = checks.filter((item) => item.kyc_status === 'verified').length;
    const pending = checks.filter(
      (item) =>
        item.kyc_status === 'pending' || item.aml_status === 'pending' || item.ofac_status === 'pending',
    ).length;
    const rejected = checks.filter(
      (item) => item.kyc_status === 'rejected' || item.aml_status === 'rejected' || item.ofac_status === 'rejected',
    ).length;
    const docDistribution = documents.reduce(
      (acc, document) => {
        acc[document.owner_type] = (acc[document.owner_type] || 0) + 1;
        return acc;
      },
      { user: 0, investment: 0, project: 0, group: 0 },
    );
    return { verified, pending, rejected, docDistribution };
  }, [checks, documents]);

  const handleUpdate = async (checkId, payload) => {
    setUpdatingId(checkId);
    setError(null);
    try {
      await updateComplianceCheck(checkId, payload);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update compliance record.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout active="compliance">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Compliance oversight</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Identity verification / AML monitoring</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review verification status, track outstanding documents, and update screening outcomes.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-pill border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
        >
          Refresh
        </button>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Verified investors</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.verified}</p>
          <p className="mt-2 text-xs text-slate-500">Fully cleared through identity verification, OFAC, and AML checks</p>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pending reviews</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.pending}</p>
          <p className="mt-2 text-xs text-slate-500">Automated reminders sent to operations weekly</p>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Rejected / flagged</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{summary.rejected}</p>
          <p className="mt-2 text-xs text-slate-500">Require manual escalation or supporting evidence</p>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Documents on file</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{documents.length}</p>
          <p className="mt-2 text-xs text-slate-500">
            User {summary.docDistribution.user || 0} · Investment {summary.docDistribution.investment || 0} · Project{' '}
            {summary.docDistribution.project || 0}
          </p>
        </article>
      </section>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p>Compiling compliance summary...</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">{error}</div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Investor</th>
                  <th className="px-4 py-3">Identity verification</th>
                  <th className="px-4 py-3">AML</th>
                  <th className="px-4 py-3">OFAC</th>
                  <th className="px-4 py-3">PEP</th>
                  <th className="px-4 py-3">Source of funds</th>
                  <th className="px-4 py-3">Next review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {checks.map((check) => (
                  <tr key={check.id} className="transition duration-150 ease-in-out hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{check.user_email || `User #${check.user}`}</p>
                      <p className="text-[11px] text-slate-400">
                        Last reviewed{' '}
                        {check.last_reviewed_at
                          ? new Date(check.last_reviewed_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={check.kyc_status}
                        disabled={updatingId === check.id}
                        onChange={(event) => handleUpdate(check.id, { kyc_status: event.target.value })}
                        className="rounded-pill border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-primary focus:outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={check.aml_status}
                        disabled={updatingId === check.id}
                        onChange={(event) => handleUpdate(check.id, { aml_status: event.target.value })}
                        className="rounded-pill border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:border-primary focus:outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(check.ofac_status)}`}>
                        {check.ofac_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(check.pep_status)}`}>
                        {check.pep_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {check.source_of_funds || '—'}
                      <p className="text-[11px] text-slate-400">
                        Fee proof {check.application_fee_proof ? 'received' : 'pending'} · Risk{' '}
                        {check.risk_disclosure_ack ? 'confirmed' : 'not signed'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {check.next_review_due
                        ? new Date(check.next_review_due).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Document repository</p>
                <p className="text-xs text-slate-500">Documents stored across users, groups, investments, and projects</p>
              </div>
              <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {documents.length}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {documents.map((document) => (
                <div key={document.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{document.title}</p>
                    <span className="rounded-pill bg-white px-3 py-1 font-semibold uppercase tracking-widest text-slate-400">
                      {document.doc_type}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">
                    Owner · {document.owner_type} #{document.object_id}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Uploaded{' '}
                    {document.uploaded_at
                      ? new Date(document.uploaded_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                    {document.expires_at
                      ? ` · Expires ${new Date(document.expires_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}`
                      : ''}
                  </p>
                  {document.file ? (
                    <a
                      href={document.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center rounded-pill border border-primary/20 px-3 py-1 font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
                    >
                      View file
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  );
};

export default AdminCompliancePage;
