import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  createSuperAdminProject,
  createSuperAdminProjectDesignAsset,
  deleteSuperAdminProject,
  deleteSuperAdminProjectDesignAsset,
  fetchSuperAdminGroups,
  fetchSuperAdminMe,
  fetchSuperAdminProjectDesignAssets,
  fetchSuperAdminProjects,
  updateSuperAdminProject,
} from '../api/superadmin';
import { sanitizeUrl } from '../utils/url';

const defaultForm = {
  group: '',
  name: '',
  summary: '',
  description: '',
  location: '',
};

const SuperAdminProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupFilter, setGroupFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(defaultForm);
  // Displayed as "Highlights" in the UI, but stored on the existing
  // `amenities` field — there's no separate highlights field on the backend.
  const [highlightDraft, setHighlightDraft] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [imagesProject, setImagesProject] = useState(null);
  const [galleryAssets, setGalleryAssets] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagesError, setImagesError] = useState(null);

  const projectsQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (groupFilter) params.set('group', groupFilter);
    return `?${params.toString()}`;
  }, [groupFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const [projectsData, groupsData] = await Promise.all([
        fetchSuperAdminProjects(projectsQuery),
        fetchSuperAdminGroups(),
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData.results || []);
      setGroups(Array.isArray(groupsData) ? groupsData : groupsData.results || []);
    } catch (err) {
      setError(err.message || 'Unable to load projects.');
      if (err?.status === 401 || err?.status === 403) {
        navigate('/super-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, projectsQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateForm = () => {
    setEditingProject(null);
    setForm(defaultForm);
    setHighlights([]);
    setHighlightDraft('');
    setFeaturedImageFile(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (project) => {
    setEditingProject(project);
    setForm({
      group: String(project.group || ''),
      name: project.name || '',
      summary: project.summary || '',
      description: project.description || '',
      location: project.location || '',
    });
    setHighlights(Array.isArray(project.amenities) ? project.amenities : []);
    setHighlightDraft('');
    setFeaturedImageFile(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addHighlight = () => {
    const trimmed = highlightDraft.trim();
    if (!trimmed) return;
    setHighlights((prev) => [...prev, trimmed]);
    setHighlightDraft('');
  };

  const removeHighlight = (index) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.group || !form.name.trim()) {
      setFormError('Group and project name are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = new FormData();
      payload.append('group', form.group);
      payload.append('name', form.name.trim());
      if (form.summary.trim()) payload.append('summary', form.summary.trim());
      if (form.description.trim()) payload.append('description', form.description.trim());
      if (form.location.trim()) payload.append('location', form.location.trim());
      payload.append('amenities', JSON.stringify(highlights));
      if (featuredImageFile) payload.append('featured_image', featuredImageFile);

      if (editingProject) {
        await updateSuperAdminProject(editingProject.id, payload);
      } else {
        await createSuperAdminProject(payload);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message || 'Unable to save this project right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project) => {
    try {
      await deleteSuperAdminProject(project.id);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to delete this project.');
    }
  };

  const loadGallery = useCallback(async (project) => {
    setLoadingGallery(true);
    setImagesError(null);
    try {
      const response = await fetchSuperAdminProjectDesignAssets(project.id);
      const list = Array.isArray(response) ? response : response.results || [];
      setGalleryAssets(list.filter((asset) => asset.media_type === 'image'));
    } catch (err) {
      setImagesError(err.message || 'Unable to load gallery images.');
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  const openImagesModal = (project) => {
    setImagesProject(project);
    setGalleryFiles([]);
    setImagesError(null);
    loadGallery(project);
  };

  const handleUploadImages = async () => {
    if (!imagesProject || galleryFiles.length === 0) return;
    setUploadingImages(true);
    setImagesError(null);
    try {
      for (const file of galleryFiles) {
        const payload = new FormData();
        payload.append('project', imagesProject.id);
        payload.append('title', `${imagesProject.name} - ${file.name}`.slice(0, 255));
        payload.append('media_type', 'image');
        payload.append('image', file);
        await createSuperAdminProjectDesignAsset(imagesProject.id, payload);
      }
      setGalleryFiles([]);
      await loadGallery(imagesProject);
    } catch (err) {
      setImagesError(err.message || 'Unable to upload these images right now.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (assetId) => {
    if (!imagesProject) return;
    try {
      await deleteSuperAdminProjectDesignAsset(assetId);
      setGalleryAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    } catch (err) {
      setImagesError(err.message || 'Unable to remove this image.');
    }
  };

  return (
    <SuperAdminShell
      title="Projects"
      subtitle="Super Admin"
      actions={
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-in-out hover:bg-primary/90"
        >
          + New project
        </button>
      }
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">All projects</h3>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
          >
            <option value="">All groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-6 text-sm text-slate-600">Loading projects...</div>
        ) : projects.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No projects found.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-500">{project.group_name || 'Group'}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {project.status || 'draft'}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-500">{project.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{project.active_investors || 0} co-investors</span>
                  <span>&middot;</span>
                  <span>Investment: Undisclosed</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(project)}
                    className="rounded-pill border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openImagesModal(project)}
                    className="rounded-pill border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    Manage images
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project)}
                    className="rounded-pill bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProject ? 'Edit project' : 'New project'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {formError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {formError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Group *</label>
                  <select
                    name="group"
                    value={form.group}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select group
                    </option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</label>
                  <input
                    name="summary"
                    value={form.summary}
                    onChange={handleFormChange}
                    placeholder="Short one-line summary shown on cards"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Full project detail description"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Co-investors count is computed automatically from actual group membership — it can't be set manually.
                Investment amount is intentionally never shown (always displays as "Undisclosed").
              </p>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlights</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={highlightDraft}
                    onChange={(e) => setHighlightDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addHighlight();
                      }
                    }}
                    placeholder="e.g. 4 apartments (2BR, 2 bathroom, kitchen, dining area)"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="flex-shrink-0 rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary/40 hover:text-primary"
                  >
                    Add
                  </button>
                </div>
                {highlights.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {highlights.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                      >
                        <span className="min-w-0 flex-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeHighlight(index)}
                          className="flex-shrink-0 text-rose-500 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Featured image {editingProject ? '(leave blank to keep current)' : ''}
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFeaturedImageFile(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
              >
                {submitting ? 'Saving...' : editingProject ? 'Save changes' : 'Create project'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {imagesProject ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Manage images &middot; {imagesProject.name}</h2>
              <button
                type="button"
                onClick={() => setImagesProject(null)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {imagesError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {imagesError}
              </div>
            ) : null}

            {loadingGallery ? (
              <p className="mt-4 text-sm text-slate-500">Loading gallery...</p>
            ) : galleryAssets.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryAssets.map((asset) => (
                  <div key={asset.id} className="group relative overflow-hidden rounded-2xl bg-slate-100">
                    <img src={sanitizeUrl(asset.image)} alt={asset.title || ''} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(asset.id)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No gallery images yet.</p>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add images</label>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={handleUploadImages}
                disabled={uploadingImages || galleryFiles.length === 0}
                className="mt-3 w-full rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
              >
                {uploadingImages ? 'Uploading...' : `Upload ${galleryFiles.length || ''} image${galleryFiles.length === 1 ? '' : 's'}`.trim()}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminShell>
  );
};

export default SuperAdminProjectsPage;
