import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { createGroupDocument } from '../api/groups';

const defaultForm = {
  documentType: 'architectural',
  title: '',
  files: [],
};

const typeOptions = [
  { value: 'architectural', label: 'Architectural drawings' },
  { value: 'boq', label: 'BOQs (Bill of Quantities)' },
  { value: 'legal', label: 'Legal PDFs' },
  { value: 'other', label: 'Other' },
];

const GroupDocumentManager = ({ groupId, isAdmin, onUploaded, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      setError(null);
    }
  }, [open]);

  const selectedFiles = useMemo(() => Array.from(form.files || []), [form.files]);

  if (!isAdmin) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setForm((prev) => ({ ...prev, files: event.target.files || [] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!groupId) {
      setError('Select a group before uploading documents.');
      return;
    }
    if (selectedFiles.length === 0) {
      setError('Choose at least one document to upload.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      for (const file of selectedFiles) {
        const payload = new FormData();
        payload.append('group', groupId);
        payload.append('document_type', form.documentType);
        payload.append('file', file);

        const baseTitle = form.title.trim();
        const derivedTitle = baseTitle
          ? selectedFiles.length === 1
            ? baseTitle
            : `${baseTitle} - ${file.name}`
          : '';
        if (derivedTitle) {
          payload.append('title', derivedTitle.slice(0, 255));
        }

        await createGroupDocument(payload);
      }
      setOpen(false);
      onUploaded?.();
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload documents right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out hover:bg-primary/90"
      >
        + Upload documents
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Group documents</p>
                <h2 className="text-lg font-semibold text-slate-900">Upload group references</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Share architectural drawings, BOQs, and legal PDFs with investors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document type
                  <select
                    name="documentType"
                    value={form.documentType}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title (optional)
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    maxLength={120}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="e.g., Draft BOQ summary"
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    When uploading multiple files, file names are used.
                  </span>
                </label>
              </div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Upload files
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={handleFileChange}
                  className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm"
                  required
                />
                <span className="mt-1 block text-xs text-slate-400">
                  PDFs or images recommended. You can select multiple files at once.
                </span>
              </label>

              {selectedFiles.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} selected
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-pill px-4 py-2 text-sm font-semibold text-slate-500 transition duration-150 ease-in-out hover:bg-slate-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={clsx(
                    'rounded-pill px-5 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out',
                    submitting ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/90',
                  )}
                >
                  {submitting ? 'Uploading...' : 'Upload documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GroupDocumentManager;
