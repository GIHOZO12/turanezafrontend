import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import SuperAdminShell from '../components/SuperAdminShell';
import {
  fetchSuperAdminGroups,
  fetchSuperAdminGroup,
  fetchSuperAdminMe,
  freezeSuperAdminGroup,
  unfreezeSuperAdminGroup,
  suspendSuperAdminGroup,
  addGroupInvestor,
  removeGroupInvestor,
  replaceGroupAdmin,
  unmarkGroupAdmin,
  postGroupAnnouncement,
  fetchSuperAdminProjects,
  fetchSuperAdminGroupDocuments,
  createSuperAdminGroupDocument,
  deleteSuperAdminGroupDocument,
  fetchSuperAdminProjectDesignAssets,
  createSuperAdminProjectDesignAsset,
  deleteSuperAdminProjectDesignAsset,
  fetchSuperAdminProjectProposals,
  createSuperAdminProjectProposal,
  deleteSuperAdminProjectProposal,
} from '../api/superadmin';

const documentTypeOptions = [
  { value: 'architectural', label: 'Architectural drawings' },
  { value: 'boq', label: 'BOQs (Bill of Quantities)' },
  { value: 'legal', label: 'Legal PDFs' },
  { value: 'other', label: 'Other' },
];

const defaultDocForm = { documentType: 'architectural', title: '', files: [] };
const defaultProposalForm = { title: '', description: '', votingDeadline: '', status: 'open' };
import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'inactive':
      return 'bg-amber-100 text-amber-700';
    case 'archived':
      return 'bg-rose-100 text-rose-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const SuperAdminGroupsPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const hasInitialSelection = useRef(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionNote, setActionNote] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [actionId, setActionId] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [docForm, setDocForm] = useState(defaultDocForm);
  const [docSubmitting, setDocSubmitting] = useState(false);

  const [groupProjects, setGroupProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('');

  const [galleryAssets, setGalleryAssets] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState(null);
  const [proposalForm, setProposalForm] = useState(defaultProposalForm);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchSuperAdminMe();
      const data = await fetchSuperAdminGroups();
      const list = Array.isArray(data) ? data : data.results || [];
      setGroups(list);
      if (list.length && !hasInitialSelection.current) {
        const detail = await fetchSuperAdminGroup(list[0].id);
        setSelected(detail);
        hasInitialSelection.current = true;
      }
    } catch (err) {
      setError(err.message || 'Unable to load groups.');
      if (err?.status === 401 || err?.status === 403) {
        navigate('/super-admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups.filter((group) => `${group.name} ${group.reference_code}`.toLowerCase().includes(q));
  }, [groups, query]);

  const selectGroup = async (id) => {
    setActionId(id);
    try {
      const detail = await fetchSuperAdminGroup(id);
      setSelected(detail);
    } catch (err) {
      setError(err.message || 'Unable to load group detail.');
    } finally {
      setActionId(null);
    }
  };

  const handleFreeze = async (id) => {
    setActionId(id);
    try {
      await freezeSuperAdminGroup(id, { reason: reasonNote });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to freeze group.');
    } finally {
      setActionId(null);
    }
  };

  const handleUnfreeze = async (id) => {
    setActionId(id);
    try {
      await unfreezeSuperAdminGroup(id, { reason: reasonNote });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to unfreeze group.');
    } finally {
      setActionId(null);
    }
  };

  const handleSuspend = async (id) => {
    setActionId(id);
    try {
      await suspendSuperAdminGroup(id, { reason: reasonNote });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to suspend group.');
    } finally {
      setActionId(null);
    }
  };

  const handleAnnouncement = async () => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await postGroupAnnouncement(selected.id, { body: actionNote, reason: reasonNote });
      setActionNote('');
      await selectGroup(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to post announcement.');
    } finally {
      setActionId(null);
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await replaceGroupAdmin(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to make this member the group admin.');
    } finally {
      setActionId(null);
    }
  };

  const handleUnmarkAdmin = async (userId) => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await unmarkGroupAdmin(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to remove this member\'s admin role.');
    } finally {
      setActionId(null);
    }
  };

  const handleAddInvestor = async () => {
    if (!selected) return;
    const userId = prompt('Enter investor user ID');
    if (!userId) return;
    setActionId(selected.id);
    try {
      await addGroupInvestor(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to add investor.');
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveInvestor = async (userId) => {
    if (!selected) return;
    setActionId(selected.id);
    try {
      await removeGroupInvestor(selected.id, { user_id: userId, reason: reasonNote });
      await selectGroup(selected.id);
    } catch (err) {
      setError(err.message || 'Unable to remove investor.');
    } finally {
      setActionId(null);
    }
  };

  const loadGroupDocuments = useCallback(async (groupId) => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const response = await fetchSuperAdminGroupDocuments(groupId);
      setDocuments(Array.isArray(response) ? response : response.results || []);
    } catch (err) {
      setDocumentsError(err.message || 'Unable to load group documents.');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  const loadGroupProjects = useCallback(async (groupId) => {
    try {
      const response = await fetchSuperAdminProjects(`?group=${groupId}`);
      const list = Array.isArray(response) ? response : response.results || [];
      setGroupProjects(list);
      setActiveProjectId((prev) => (list.some((project) => String(project.id) === String(prev)) ? prev : list[0]?.id || ''));
    } catch (err) {
      setGroupProjects([]);
      setActiveProjectId('');
    }
  }, []);

  useEffect(() => {
    if (!selected?.id) {
      setDocuments([]);
      setGroupProjects([]);
      setActiveProjectId('');
      return;
    }
    loadGroupDocuments(selected.id);
    loadGroupProjects(selected.id);
  }, [selected?.id, loadGroupDocuments, loadGroupProjects]);

  const loadGallery = useCallback(async (projectId) => {
    if (!projectId) {
      setGalleryAssets([]);
      return;
    }
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const response = await fetchSuperAdminProjectDesignAssets(projectId);
      const list = Array.isArray(response) ? response : response.results || [];
      setGalleryAssets(list);
    } catch (err) {
      setGalleryError(err.message || 'Unable to load design assets.');
      setGalleryAssets([]);
    } finally {
      setGalleryLoading(false);
    }
  }, []);

  const loadProposals = useCallback(async (projectId) => {
    if (!projectId) {
      setProposals([]);
      return;
    }
    setProposalsLoading(true);
    setProposalsError(null);
    try {
      const response = await fetchSuperAdminProjectProposals(projectId);
      const list = Array.isArray(response) ? response : response.results || [];
      setProposals(list);
    } catch (err) {
      setProposalsError(err.message || 'Unable to load proposals.');
      setProposals([]);
    } finally {
      setProposalsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGallery(activeProjectId);
    loadProposals(activeProjectId);
  }, [activeProjectId, loadGallery, loadProposals]);

  const handleDocFormChange = (event) => {
    const { name, value } = event.target;
    setDocForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadDocuments = async (event) => {
    event.preventDefault();
    if (!selected) return;
    const files = Array.from(docForm.files || []);
    if (files.length === 0) {
      setDocumentsError('Choose at least one file to upload.');
      return;
    }
    setDocSubmitting(true);
    setDocumentsError(null);
    try {
      for (const file of files) {
        const payload = new FormData();
        payload.append('group', selected.id);
        payload.append('document_type', docForm.documentType);
        const baseTitle = docForm.title.trim();
        const derivedTitle = baseTitle ? (files.length === 1 ? baseTitle : `${baseTitle} - ${file.name}`) : '';
        if (derivedTitle) payload.append('title', derivedTitle.slice(0, 255));
        payload.append('file', file);
        await createSuperAdminGroupDocument(selected.id, payload);
      }
      setDocForm(defaultDocForm);
      await loadGroupDocuments(selected.id);
    } catch (err) {
      setDocumentsError(err.message || 'Unable to upload these documents right now.');
    } finally {
      setDocSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await deleteSuperAdminGroupDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setDocumentsError(err.message || 'Unable to remove this document.');
    }
  };

  const handleUploadGalleryImages = async () => {
    if (!activeProjectId || galleryFiles.length === 0) return;
    setGalleryUploading(true);
    setGalleryError(null);
    try {
      const project = groupProjects.find((item) => String(item.id) === String(activeProjectId));
      for (const file of galleryFiles) {
        const payload = new FormData();
        payload.append('project', activeProjectId);
        payload.append('title', `${project?.name || 'Design asset'} - ${file.name}`.slice(0, 255));
        payload.append('media_type', 'image');
        payload.append('image', file);
        await createSuperAdminProjectDesignAsset(activeProjectId, payload);
      }
      setGalleryFiles([]);
      await loadGallery(activeProjectId);
    } catch (err) {
      setGalleryError(err.message || 'Unable to upload these images right now.');
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleDeleteGalleryAsset = async (assetId) => {
    try {
      await deleteSuperAdminProjectDesignAsset(assetId);
      setGalleryAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    } catch (err) {
      setGalleryError(err.message || 'Unable to remove this asset.');
    }
  };

  const handleProposalFormChange = (event) => {
    const { name, value } = event.target;
    setProposalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProposal = async (event) => {
    event.preventDefault();
    if (!activeProjectId) return;
    if (!proposalForm.title.trim() || !proposalForm.description.trim() || !proposalForm.votingDeadline) {
      setProposalsError('Title, description, and voting deadline are all required.');
      return;
    }
    setProposalSubmitting(true);
    setProposalsError(null);
    try {
      await createSuperAdminProjectProposal(activeProjectId, {
        title: proposalForm.title.trim(),
        description: proposalForm.description.trim(),
        voting_deadline: new Date(proposalForm.votingDeadline).toISOString(),
        status: proposalForm.status,
      });
      setProposalForm(defaultProposalForm);
      await loadProposals(activeProjectId);
    } catch (err) {
      setProposalsError(err.message || 'Unable to publish this proposal right now.');
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleDeleteProposal = async (proposalId) => {
    try {
      await deleteSuperAdminProjectProposal(proposalId);
      setProposals((prev) => prev.filter((proposal) => proposal.id !== proposalId));
    } catch (err) {
      setProposalsError(err.message || 'Unable to remove this proposal.');
    }
  };

  return (
    <SuperAdminShell title="Groups" subtitle="Super Admin">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Group directory</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-pill border border-slate-200 px-3 py-2 text-xs"
              placeholder="Search groups..."
            />
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-6 text-sm text-slate-500">Loading groups...</div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => selectGroup(group.id)}
                  className={clsx(
                    'w-full rounded-2xl border px-4 py-3 text-left transition',
                    selected?.id === group.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-100 bg-white hover:border-primary/40',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        Code: {group.reference_code || 'N/A'} · Members: {group.members_count}
                      </p>
                    </div>
                    <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(group.status)}`}>
                      {group.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Pending apps: {group.pending_applications} · Overdue installments: {group.overdue_installments}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Group Health</p>
                  <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-xs text-slate-500">Admin: {selected.created_by_name || 'N/A'}</p>
                </div>
                <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${statusBadge(selected.status)}`}>
                  {selected.status}
                </span>
              </div>

              <div className="grid gap-4 text-xs text-slate-500 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Committed</p>
                  <p>{selected.health?.total_committed || selected.total_committed}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Paid</p>
                  <p>{selected.health?.total_paid || '0'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Pending apps</p>
                  <p>{selected.health?.pending_applications || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-700">Overdue installments</p>
                  <p>{selected.health?.overdue_installments || 0}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => handleFreeze(selected.id)}
                  disabled={actionId === selected.id}
                  className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  Freeze investments
                </button>
                <button
                  type="button"
                  onClick={() => handleUnfreeze(selected.id)}
                  disabled={actionId === selected.id}
                  className="rounded-pill border border-slate-200 px-3 py-2 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  Unfreeze
                </button>
                <button
                  type="button"
                  onClick={() => handleSuspend(selected.id)}
                  disabled={actionId === selected.id}
                  className="rounded-pill bg-rose-500 px-3 py-2 font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                >
                  Suspend group
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Reason (optional)</p>
                <input
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  className="mt-3 w-full rounded-pill border border-slate-200 px-3 py-2 text-xs"
                  placeholder="Reason for this action (freeze, suspend, replace, move...)"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Official announcement</p>
                <textarea
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Send an official guidance message to the group"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAnnouncement}
                  disabled={!actionNote || actionId === selected.id}
                  className="mt-3 rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  Post announcement
                </button>
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Active investors</p>
                  <button
                    type="button"
                    onClick={handleAddInvestor}
                    className="rounded-pill border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    Add investor
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">Choose a member below to make them this group's admin.</p>
                <div className="mt-3 space-y-2 text-xs">
                  {selected.active_members?.length ? (
                    selected.active_members.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-700">
                            {member.name}{' '}
                            {member.role === 'admin' ? (
                              <span className="ml-1 rounded-pill bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Admin
                              </span>
                            ) : null}
                          </p>
                          <p className="text-slate-400">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' ? (
                            member.id === selected.created_by ? (
                              <span
                                title="Make someone else admin to reassign group ownership."
                                className="rounded-pill bg-slate-200 px-3 py-1 font-semibold text-slate-500"
                              >
                                Group owner
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUnmarkAdmin(member.id)}
                                disabled={actionId === selected.id}
                                className="rounded-pill border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Unmark admin
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakeAdmin(member.id)}
                              disabled={actionId === selected.id}
                              className="rounded-pill bg-slate-900 px-3 py-1 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Make admin
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveInvestor(member.id)}
                            className="rounded-pill border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No active members loaded.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Group documents</p>
                <p className="mt-1 text-xs text-slate-400">
                  Architectural drawings, BOQs, and legal PDFs shared with this group's investors.
                </p>

                {documentsError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                    {documentsError}
                  </div>
                ) : null}

                <div className="mt-3 space-y-2 text-xs">
                  {documentsLoading ? (
                    <p className="text-slate-500">Loading documents...</p>
                  ) : documents.length ? (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-700">
                            {doc.title || (doc.file ? doc.file.split('/').pop() : 'Document')}
                          </p>
                          <p className="text-slate-400">
                            {documentTypeOptions.find((opt) => opt.value === doc.document_type)?.label || doc.document_type}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {doc.file ? (
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-pill border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                            >
                              View
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-pill border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No documents uploaded yet.</p>
                  )}
                </div>

                <form onSubmit={handleUploadDocuments} className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      name="documentType"
                      value={docForm.documentType}
                      onChange={handleDocFormChange}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      {documentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      name="title"
                      value={docForm.title}
                      onChange={handleDocFormChange}
                      placeholder="Title (optional)"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={(e) => setDocForm((prev) => ({ ...prev, files: e.target.files || [] }))}
                    className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={docSubmitting}
                    className="w-full rounded-pill bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                  >
                    {docSubmitting ? 'Uploading...' : 'Upload document(s)'}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Architectural design library</p>
                <p className="mt-1 text-xs text-slate-400">
                  Floor plans, elevations, and renderings for this group's project.
                </p>

                {groupProjects.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    This group has no project yet — create one from the Projects page before adding design assets.
                  </p>
                ) : (
                  <>
                    {groupProjects.length > 1 ? (
                      <select
                        value={activeProjectId}
                        onChange={(e) => setActiveProjectId(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        {groupProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {galleryError ? (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                        {galleryError}
                      </div>
                    ) : null}

                    {galleryLoading ? (
                      <p className="mt-3 text-xs text-slate-500">Loading design assets...</p>
                    ) : galleryAssets.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {galleryAssets.map((asset) => (
                          <div key={asset.id} className="group relative overflow-hidden rounded-2xl bg-slate-100">
                            {asset.media_type === 'image' && asset.image ? (
                              <img src={asset.image} alt={asset.title || ''} className="h-24 w-full object-cover" />
                            ) : (
                              <div className="flex h-24 w-full items-center justify-center bg-slate-900 text-[10px] font-semibold uppercase text-white">
                                Video embed
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteGalleryAsset(asset.id)}
                              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-xs text-white opacity-0 transition group-hover:opacity-100"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">No design assets uploaded yet.</p>
                    )}

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                        className="w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleUploadGalleryImages}
                        disabled={galleryUploading || galleryFiles.length === 0}
                        className="w-full rounded-pill bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                      >
                        {galleryUploading ? 'Uploading...' : `Upload ${galleryFiles.length || ''} image${galleryFiles.length === 1 ? '' : 's'}`.trim()}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Governance highlights</p>
                <p className="mt-1 text-xs text-slate-400">Publish proposals for this group's project and track votes.</p>

                {groupProjects.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    This group has no project yet — create one from the Projects page before publishing proposals.
                  </p>
                ) : (
                  <>
                    {proposalsError ? (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                        {proposalsError}
                      </div>
                    ) : null}

                    <div className="mt-3 space-y-2 text-xs">
                      {proposalsLoading ? (
                        <p className="text-slate-500">Loading proposals...</p>
                      ) : proposals.length ? (
                        proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-700">{proposal.title}</p>
                              <p className="text-slate-400">
                                {proposal.status} - Deadline {new Date(proposal.voting_deadline).toLocaleString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteProposal(proposal.id)}
                              className="flex-shrink-0 rounded-pill border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">No proposals published yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleCreateProposal} className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      <input
                        name="title"
                        value={proposalForm.title}
                        onChange={handleProposalFormChange}
                        placeholder="Proposal title"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <textarea
                        name="description"
                        value={proposalForm.description}
                        onChange={handleProposalFormChange}
                        rows={3}
                        placeholder="Describe what investors are voting on"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="datetime-local"
                          name="votingDeadline"
                          value={proposalForm.votingDeadline}
                          onChange={handleProposalFormChange}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        />
                        <select
                          name="status"
                          value={proposalForm.status}
                          onChange={handleProposalFormChange}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                          <option value="executed">Executed</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={proposalSubmitting}
                        className="w-full rounded-pill bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                      >
                        {proposalSubmitting ? 'Publishing...' : 'Publish proposal'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a group to view details.</p>
          )}
        </section>
      </div>
    </SuperAdminShell>
  );
};

export default SuperAdminGroupsPage;
