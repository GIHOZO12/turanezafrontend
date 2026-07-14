import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import InvestorLayout from '../components/InvestorLayout';
import { legalApi } from '../api/legal';
import { uploadComplianceRequirement } from '../api/compliance';
import { InvestorContext } from '../components/InvestorLayout';

const requirementOptions = [
  { value: 'ID_PASSPORT', label: 'ID / Passport' },
  { value: 'BANK_STATEMENT', label: 'Bank statement' },
  { value: 'SIGNED_AGREEMENT', label: 'Signed investment agreement' },
  { value: 'AML_DECLARATION', label: 'Anti Money Laundering (AML) declaration' },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of address' },
  { value: 'CRIMINAL_RECORD', label: 'Police clearance / criminal record' },
];

const LegalDocPage = () => {
  const { slug } = useParams();
  const { user } = useContext(InvestorContext);
  const [doc, setDoc] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    requirement_code: 'ID_PASSPORT',
    file: null,
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setMessage('');
      try {
        const data = await legalApi.getDoc(slug);
        if (alive) {
          setDoc(data);
        }
      } catch (err) {
        if (alive) {
          setMessage(err.message || 'Unable to load document.');
        }
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  const accept = async () => {
    if (!doc) return;
    setMessage('');
    try {
      await legalApi.accept(doc.slug, doc.version);
      setMessage('Accepted successfully.');
    } catch (err) {
      setMessage(err.message || 'Unable to accept the document.');
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!user || !uploadForm.file) {
      setMessage('Please select a file before uploading.');
      return;
    }
    const formData = new FormData();
    formData.append('requirement_code', uploadForm.requirement_code);
    formData.append('file', uploadForm.file);

    setUploading(true);
    setMessage('');
    try {
      await uploadComplianceRequirement(formData);
      setMessage('Document uploaded successfully.');
      setUploadForm({ title: '', requirement_code: 'ID_PASSPORT', file: null });
    } catch (err) {
      setMessage(err.message || 'Unable to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <InvestorLayout active="legal">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-card">
        {doc ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Legal document</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {doc.title} (v{doc.version})
            </h1>
            {doc.summary ? <p className="mt-2 text-sm text-slate-500">{doc.summary}</p> : null}
            <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {doc.content_md}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={accept}
                className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90"
              >
                Accept
              </button>
              {message ? <span className="text-xs text-slate-500">{message}</span> : null}
            </div>

            {user ? (
              <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Upload supporting documents
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Upload ID, criminal record, AML proof, bank statement, or signed agreement while reviewing this
                  document.
                </p>
                <form className="mt-4 space-y-3" onSubmit={handleUpload}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={uploadForm.requirement_code}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, requirement_code: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      {requirementOptions.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      placeholder="Document title (optional)"
                    />
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-pill bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {uploading ? 'Uploading...' : 'Upload document'}
                  </button>
                </form>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">Loading document...</p>
        )}
        {message && !doc ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {message}
          </div>
        ) : null}
      </div>
    </InvestorLayout>
  );
};

export default LegalDocPage;
