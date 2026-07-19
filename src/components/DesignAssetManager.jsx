import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { createProjectDesignAsset } from '../api/projects';

const defaultForm = (projectId) => ({
  projectId,
  title: '',
  description: '',
  mediaType: 'image',
  image: null,
  videoUrl: '',
});

const DesignAssetManager = ({ projects, isAdmin, onCreated, className = '' }) => {
  const primaryProjectId = projects?.[0]?.id ?? '';
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => defaultForm(primaryProjectId));

  useEffect(() => {
    if (!open) {
      setForm(defaultForm(primaryProjectId));
      setError(null);
    }
  }, [open, primaryProjectId]);

  const projectOptions = useMemo(
    () => (projects || []).map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );

  if (!isAdmin || projectOptions.length === 0) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.projectId) {
      setError('Select a project before uploading.');
      return;
    }
    if (!form.title.trim()) {
      setError('Provide a title for the asset.');
      return;
    }
    if (form.mediaType === 'image' && !form.image) {
      setError('Upload an image for this design asset.');
      return;
    }
    if (form.mediaType === 'video' && !form.videoUrl.trim()) {
      setError('Provide a video URL.');
      return;
    }

    const payload = new FormData();
    payload.append('project', form.projectId);
    payload.append('title', form.title.trim());
    if (form.description.trim()) {
      payload.append('description', form.description.trim());
    }
    payload.append('media_type', form.mediaType);
    if (form.mediaType === 'image' && form.image) {
      payload.append('image', form.image);
    }
    if (form.mediaType === 'video' && form.videoUrl.trim()) {
      payload.append('video_url', form.videoUrl.trim());
    }

    setSubmitting(true);
    setError(null);
    try {
      await createProjectDesignAsset(payload);
      setOpen(false);
      onCreated?.(form.projectId);
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload design asset right now.');
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
        + Add design asset
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Architectural asset</p>
                <h2 className="text-lg font-semibold text-slate-900">Upload design reference</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Share floor plans, elevations, 3D renders, or walkthrough previews with investors.
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
                  Project
                  <select
                    name="projectId"
                    value={form.projectId}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    required
                  >
                    {projectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Media type
                  <select
                    name="mediaType"
                    value={form.mediaType}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video embed</option>
                  </select>
                </label>
              </div>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="e.g., Front elevation, Unit type A, Lobby concept"
                  required
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description <span className="text-slate-400">(optional)</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="Provide context such as materials, room layout, or camera angle."
                />
              </label>

              {form.mediaType === 'image' ? (
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm"
                    required
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    PNG, JPG, or WEBP up to 5MB recommended.
                  </span>
                </label>
              ) : (
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Video URL
                  <input
                    name="videoUrl"
                    value={form.videoUrl}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="https://youtu.be/... or https://vimeo.com/..."
                    required
                  />
                  <span className="mt-1 block text-xs text-slate-400">
                    Paste a share link from YouTube, Vimeo, or another hosting service.
                  </span>
                </label>
              )}

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
                  {submitting ? 'Uploading...' : 'Create asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DesignAssetManager;
