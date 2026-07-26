
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import {
  fetchGroupById,
  fetchMemberships,
  fetchGroupApplications,
  fetchGroupDocuments,
  reviewGroupApplication,
} from '../api/groups';
import { fetchProjects, fetchPropertyListings, fetchProjectDesignAssets, deleteProjectDesignAsset } from '../api/projects';
import { fetchProposals } from '../api/governance';
import { fetchCurrentUser } from '../api/users';
import DesignAssetManager from '../components/DesignAssetManager';
import DesignAssetLightbox from '../components/DesignAssetLightbox';
import GroupDocumentManager from '../components/GroupDocumentManager';
import InvestorLayout from '../components/InvestorLayout';
import { formatCurrency } from '../utils/currency';
import { sanitizeUrl } from '../utils/url';

const formatUsdValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Flexible';
  }
  return formatCurrency(numeric);
};

const formatStatusLabel = (status) => {
  if (!status) {
    return 'Unknown';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const resolveCapacityTarget = (group) => {
  const totalUnits = Number(group?.total_units);
  if (Number.isFinite(totalUnits) && totalUnits > 0) {
    return totalUnits;
  }
  const maxMembers = Number(group?.max_members);
  if (Number.isFinite(maxMembers) && maxMembers > 0) {
    return maxMembers;
  }
  return null;
};

const formatDateTime = (value, { includeTime = true } = {}) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  const options = { dateStyle: 'medium' };
  if (includeTime) {
    options.timeStyle = 'short';
  }
  return date.toLocaleString(undefined, options);
};

const applicationStatusMeta = {
  pending: { label: 'Pending review', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  review: { label: 'Under review', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  approved: { label: 'Approved', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', tone: 'bg-rose-50 text-rose-600 border-rose-200' },
  withdrawn: { label: 'Withdrawn', tone: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const installmentLabels = {
  one: 'One installment',
  two: 'Two installments',
  three: 'Three installments',
  four: 'Four installments',
};

const documentTypeLabels = {
  architectural: 'Architectural drawing',
  boq: 'BOQ',
  legal: 'Legal PDF',
  other: 'Other',
};

const normaliseApplicationList = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};

const summariseVotes = (votes = []) =>
  votes.reduce(
    (acc, vote) => {
      const key = (vote.choice || 'yes').toLowerCase();
      if (key === 'yes' || key === 'no' || key === 'abstain') {
        acc[key] += 1;
      }
      return acc;
    },
    { yes: 0, no: 0, abstain: 0 },
  );

const defaultLightboxState = { open: false, projectIndex: 0, assetIndex: 0 };

const normaliseList = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
};
const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [designAssetsByProject, setDesignAssetsByProject] = useState({});
  const [designAssetsLoading, setDesignAssetsLoading] = useState(false);
  const [designAssetsError, setDesignAssetsError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(defaultLightboxState);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState(null);
  const [reviewSubmittingId, setReviewSubmittingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let alive = true;

    const loadCurrentUser = async () => {
      try {
        const user = await fetchCurrentUser();
        if (alive) {
          setCurrentUser(user);
        }
      } catch (loadUserError) {
        if (alive) {
          setCurrentUser(null);
        }
      }
    };

    loadCurrentUser();
    return () => {
      alive = false;
    };
  }, []);

  const loadDesignAssetsForProjects = useCallback(async (projectList) => {
    const list = projectList || [];
    if (!list.length) {
      setDesignAssetsByProject({});
      return;
    }
    setDesignAssetsLoading(true);
    setDesignAssetsError(null);
    try {
      const entries = await Promise.all(
        list.map(async (project) => {
          const assets = await fetchProjectDesignAssets(project.id);
          return [project.id, assets || []];
        }),
      );
      setDesignAssetsByProject(Object.fromEntries(entries));
    } catch (loadError) {
      setDesignAssetsError(loadError.message || 'Unable to load architectural assets right now.');
    } finally {
      setDesignAssetsLoading(false);
    }
  }, []);

  const refreshProjectDesignAssets = useCallback(async (projectId) => {
    if (!projectId) {
      return;
    }
    try {
      const assets = await fetchProjectDesignAssets(projectId);
      setDesignAssetsByProject((prev) => ({
        ...prev,
        [projectId]: assets || [],
      }));
      setDesignAssetsError(null);
    } catch (refreshError) {
      setDesignAssetsError(refreshError.message || 'Unable to refresh architectural assets right now.');
    }
  }, []);

  const loadGroupDocuments = useCallback(
    async ({ silent = false } = {}) => {
      if (!groupId) {
        return;
      }
      if (!silent) {
        setDocumentsLoading(true);
      }
      setDocumentsError(null);
      try {
        const response = await fetchGroupDocuments(groupId);
        setDocuments(normaliseList(response));
      } catch (documentsLoadError) {
        setDocumentsError(documentsLoadError.message || 'Unable to load group documents right now.');
        setDocuments([]);
      } finally {
        if (!silent) {
          setDocumentsLoading(false);
        }
      }
    },
    [groupId],
  );

  const loadGroupApplications = useCallback(
    async ({ role, silent = false } = {}) => {
      if (!groupId) {
        return;
      }
      const effectiveRole = role || membership?.role;
      if (effectiveRole !== 'admin') {
        setApplications([]);
        setApplicationsError(null);
        setApplicationsLoading(false);
        return;
      }
      if (!silent) {
        setApplicationsLoading(true);
      }
      setApplicationsError(null);
      try {
        const response = await fetchGroupApplications({ group: groupId });
        setApplications(normaliseApplicationList(response));
      } catch (applicationsLoadError) {
        setApplicationsError(
          applicationsLoadError.message || 'Unable to load membership applications right now.',
        );
        setApplications([]);
      } finally {
        if (!silent) {
          setApplicationsLoading(false);
        }
      }
    },
    [groupId, membership?.role],
  );

  const loadGroupDetails = useCallback(
    async ({ showSpinner = true } = {}) => {
      if (!groupId) {
        return;
      }
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const [groupData, membershipsData, projectsData, propertiesData, proposalsData] = await Promise.all([
          fetchGroupById(groupId),
          fetchMemberships(),
          fetchProjects(),
          fetchPropertyListings(),
          fetchProposals(),
        ]);

        setGroup(groupData);
        const membershipList = normaliseList(membershipsData);
        const membershipEntry = membershipList.find((entry) => `${entry.group}` === `${groupId}`);
        setMembership(membershipEntry || null);

        // /api/v1/projects/projects/ has the `group` id needed to scope this
        // list, but not `active_investors` — that only exists on the
        // properties serializer. Merge the two by id rather than picking one.
        const propertyById = new Map(normaliseList(propertiesData).map((property) => [property.id, property]));
        const projectList = normaliseList(projectsData);
        const groupProjects = projectList
          .filter((project) => `${project.group}` === `${groupId}`)
          .map((project) => ({ ...project, active_investors: propertyById.get(project.id)?.active_investors ?? 0 }));
        setProjects(groupProjects);

        const projectIdSet = new Set(groupProjects.map((project) => project.id));
        const proposalList = normaliseList(proposalsData);
        const groupProposals = proposalList.filter((proposal) => projectIdSet.has(proposal.project));
        setProposals(groupProposals);

        await Promise.all([
          loadDesignAssetsForProjects(groupProjects),
          loadGroupApplications({ role: membershipEntry?.role, silent: !showSpinner }),
          loadGroupDocuments({ silent: !showSpinner }),
        ]);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load group details right now.');
        setGroup(null);
        setMembership(null);
        setProjects([]);
        setProposals([]);
        setDesignAssetsByProject({});
        setDocuments([]);
        setDocumentsError(null);
        setDocumentsLoading(false);
        setApplications([]);
        setApplicationsError(null);
        setApplicationsLoading(false);
      } finally {
        if (showSpinner) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [groupId, loadDesignAssetsForProjects, loadGroupApplications, loadGroupDocuments],
  );

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedback(location.state.feedback);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleRefresh = async () => {
    await loadGroupDetails({ showSpinner: false });
  };
  const handleJoinRequest = () => {
    if (!group) {
      return;
    }
    navigate(`/groups/${group.id}/join`);
  };

  const handleSyncApplications = async () => {
    await loadGroupApplications({ role: membership?.role });
  };

  const decisionMessages = {
    review: 'Application marked for deeper review. Remember to follow up with the applicant.',
    approved: 'Application approved. The investor will receive onboarding guidance shortly.',
    rejected: 'Application rejected. The applicant will be notified via email.',
  };

  const handleReviewDecision = async (applicationId, status) => {
    if (!applicationId || !status) {
      return;
    }
    setFeedback(null);
    setReviewSubmittingId(applicationId);
    try {
      await reviewGroupApplication(applicationId, { status });
      await loadGroupApplications({ role: membership?.role, silent: true });
      setFeedback({
        type: 'success',
        message: decisionMessages[status] || 'Application updated.',
      });
    } catch (reviewError) {
      setFeedback({
        type: 'error',
        message: reviewError.message || 'Unable to update the application status right now.',
      });
    } finally {
      setReviewSubmittingId(null);
    }
  };
  const isMember = Boolean(membership);
  const isAdmin = membership?.role === 'admin';
  const groupActive = group?.status === 'active';
  const membersCount = group?.members_count ?? 0;
  const groupCode = group?.reference_code || String(group?.id || '').padStart(5, '0');
  const capacityTarget = resolveCapacityTarget(group);
  const hasCapacity = !capacityTarget || membersCount < capacityTarget;
  const capacityLabel = capacityTarget ? `${membersCount}/${capacityTarget}` : `${membersCount}`;
  const capacityPercent = capacityTarget ? Math.min(100, Math.round((membersCount / capacityTarget) * 100)) : null;
  const minInvestmentLabel = formatUsdValue(group?.min_investment);
  const buildingCostLabel = formatUsdValue(group?.building_cost);
  const memberShareLabel = formatUsdValue(group?.member_unit_share);
  const capitalRaisedLabel = formatUsdValue(membersCount * Number(group?.member_unit_share || 0));
  const creatorName = group?.created_by?.full_name || group?.created_by?.email || 'Urban Evolution Group';

  const joinDisabled = isMember || !groupActive || !hasCapacity;
  const joinLabel = isMember
    ? 'You are already an investor'
    : !groupActive
    ? 'Group not accepting investors'
    : !hasCapacity
    ? 'Group is at capacity'
    : 'Request to join';

  const membershipBadge = isAdmin
    ? { label: 'Admin investor', tone: 'bg-primary/10 text-primary border-primary/20' }
    : isMember
    ? { label: 'Investor member', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : { label: 'Prospective investor', tone: 'bg-slate-100 text-slate-600 border-slate-200' };

  const galleryProjects = useMemo(
    () =>
      projects
        .map((project) => ({
          project,
          assets: designAssetsByProject[project.id] || [],
        }))
        .filter((entry) => entry.assets.length > 0),
    [projects, designAssetsByProject],
  );

  const totalProjectInvestors = useMemo(
    () => projects.reduce((sum, project) => sum + (Number(project.active_investors) || 0), 0),
    [projects],
  );
  const totalDesignAssets = useMemo(
    () => Object.values(designAssetsByProject).reduce((sum, assets) => sum + assets.length, 0),
    [designAssetsByProject],
  );

  const statusBuckets = useMemo(
    () =>
      projects.reduce(
        (acc, project) => {
          const key = (project.status || 'funding').toLowerCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { funding: 0, active: 0, completed: 0, archived: 0 },
      ),
    [projects],
  );

  const pendingApplications = useMemo(
    () =>
      applications.filter((application) => {
        const status = (application.status || '').toLowerCase();
        return status === 'pending' || status === 'review';
      }),
    [applications],
  );

  const decidedApplications = useMemo(
    () =>
      applications.filter((application) => {
        const status = (application.status || '').toLowerCase();
        return status === 'approved' || status === 'rejected' || status === 'withdrawn';
      }),
    [applications],
  );

  const recentDecisions = decidedApplications.slice(0, 4);

  const sortedProposals = useMemo(() => {
    const copy = [...proposals];
    copy.sort((a, b) => {
      const aTime = Date.parse(a.created_at || '') || 0;
      const bTime = Date.parse(b.created_at || '') || 0;
      return bTime - aTime;
    });
    return copy;
  }, [proposals]);

  const proposalsForDisplay = sortedProposals.slice(0, 3);
  const openProposalsCount = proposals.filter((proposal) => proposal.status === 'open').length;

  const openLightbox = (projectId, assetIndex = 0) => {
    const projectIndex = galleryProjects.findIndex((entry) => entry.project.id === projectId);
    if (projectIndex === -1) {
      return;
    }
    const targetAssets = galleryProjects[projectIndex].assets;
    const boundedIndex = Math.max(0, Math.min(assetIndex, targetAssets.length - 1));
    setLightbox({ open: true, projectIndex, assetIndex: boundedIndex });
  };

  const closeLightbox = () => {
    setLightbox(defaultLightboxState);
  };

  const currentProjectEntry = lightbox.open ? galleryProjects[lightbox.projectIndex] : null;
  const currentAsset =
    currentProjectEntry && currentProjectEntry.assets.length > 0
      ? currentProjectEntry.assets[lightbox.assetIndex]
      : null;

  const hasPrevAsset =
    currentProjectEntry && (lightbox.assetIndex > 0 || lightbox.projectIndex > 0);
  const hasNextAsset =
    currentProjectEntry &&
    (lightbox.assetIndex < currentProjectEntry.assets.length - 1 ||
      lightbox.projectIndex < galleryProjects.length - 1);
  const hasPrevProject = lightbox.projectIndex > 0;
  const hasNextProject = lightbox.projectIndex < galleryProjects.length - 1;

  const handlePrevAsset = () => {
    setLightbox((prev) => {
      if (!galleryProjects.length) {
        return prev;
      }
      const projectEntry = galleryProjects[prev.projectIndex];
      if (!projectEntry) {
        return prev;
      }
      if (prev.assetIndex > 0) {
        return { ...prev, assetIndex: prev.assetIndex - 1 };
      }
      if (prev.projectIndex > 0) {
        const previousProject = galleryProjects[prev.projectIndex - 1];
        if (!previousProject || previousProject.assets.length === 0) {
          return { open: true, projectIndex: prev.projectIndex - 1, assetIndex: 0 };
        }
        return {
          open: true,
          projectIndex: prev.projectIndex - 1,
          assetIndex: previousProject.assets.length - 1,
        };
      }
      return prev;
    });
  };

  const handleNextAsset = () => {
    setLightbox((prev) => {
      if (!galleryProjects.length) {
        return prev;
      }
      const projectEntry = galleryProjects[prev.projectIndex];
      if (!projectEntry) {
        return prev;
      }
      if (prev.assetIndex < projectEntry.assets.length - 1) {
        return { ...prev, assetIndex: prev.assetIndex + 1 };
      }
      if (prev.projectIndex < galleryProjects.length - 1) {
        const nextProject = galleryProjects[prev.projectIndex + 1];
        if (!nextProject || nextProject.assets.length === 0) {
          return { open: true, projectIndex: prev.projectIndex + 1, assetIndex: 0 };
        }
        return { open: true, projectIndex: prev.projectIndex + 1, assetIndex: 0 };
      }
      return prev;
    });
  };

  const handlePrevProject = () => {
    setLightbox((prev) => {
      if (prev.projectIndex === 0) {
        return prev;
      }
      return { open: true, projectIndex: prev.projectIndex - 1, assetIndex: 0 };
    });
  };

  const handleNextProject = () => {
    setLightbox((prev) => {
      if (prev.projectIndex >= galleryProjects.length - 1) {
        return prev;
      }
      return { open: true, projectIndex: prev.projectIndex + 1, assetIndex: 0 };
    });
  };

  const handleDeleteAsset = async () => {
    if (!currentProjectEntry || !currentAsset) {
      return;
    }
    try {
      await deleteProjectDesignAsset(currentAsset.id);
      setFeedback({ type: 'success', message: 'Design asset removed from the gallery.' });
      closeLightbox();
      await refreshProjectDesignAssets(currentProjectEntry.project.id);
    } catch (deleteError) {
      setFeedback({
        type: 'error',
        message: deleteError.message || 'Unable to delete this asset right now. Please retry shortly.',
      });
    }
  };
  if (loading) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-card">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-sm font-medium">Loading group dashboard...</p>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (error && !group) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
            <p className="text-base font-semibold text-slate-900">Group unavailable</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/groups')}
              className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
            >
              Back to groups
            </button>
          </div>
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout
      active="groups"
      headerActions={
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        <Link
          to="/groups"
          className="mb-6 inline-flex items-center rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition duration-150 ease-in-out hover:border-primary hover:text-primary"
        >
          {'<'} Back to groups
        </Link>
        {feedback ? (
          <div
            className={clsx(
              'mb-6 rounded-3xl border px-4 py-4 text-sm',
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-600',
            )}
          >
            {feedback.message}
          </div>
        ) : null}
        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-6 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Group overview</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                #{groupCode} · {group?.name || 'Investment group'}
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                {group?.description ||
                  'Investor circle within Urban Evolution Group supporting pooled capital for residential and mixed-use developments.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className={clsx('rounded-pill border px-3 py-1 font-semibold', membershipBadge.tone)}>
                  {membershipBadge.label}
                </span>
                <span>Status: {formatStatusLabel(group?.status)}</span>
                <span>Group #: #{groupCode}</span>
                <span>Members: {capacityLabel}</span>
                <span>Lead: {creatorName}</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member capacity</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{capacityLabel}</p>
                  {capacityPercent !== null ? (
                    <div className="mt-3">
                      <div className="h-1.5 w-full rounded-full bg-white/70">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{capacityPercent}% filled</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Unlimited capacity for now</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min investment</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{minInvestmentLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">Per investor commitment during onboarding</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Building cost</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{buildingCostLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{group?.total_units || 0} units planned</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your unit share</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{memberShareLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">Estimated per investor</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capital raised</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{capitalRaisedLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">Based on confirmed investors</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Group lead</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{creatorName}</p>
                  <p className="mt-1 text-xs text-slate-500">Status: {formatStatusLabel(group?.status)}</p>
                </div>
              </div>
            </div>
            <div className="w-full max-w-xs space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500 shadow-inner">
                <p>
                  Minimum commitment per investor: <span className="font-semibold text-slate-900">{minInvestmentLabel}</span>.
                    A separate RWF 100,000 commitment fee is still due within 15 days of approval to unlock investor
                  status, dashboard access, and chat invitations.
                </p>
              </div>
              <button
                type="button"
                disabled={joinDisabled}
                onClick={handleJoinRequest}
                className={clsx(
                  'w-full rounded-pill px-5 py-2 text-sm font-semibold transition duration-150 ease-in-out',
                  joinDisabled
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90',
                )}
              >
                {joinLabel}
              </button>
              {isMember ? (
                <button
                  type="button"
                  onClick={() => navigate(`/groups/${groupId}/chat`)}
                  className="w-full rounded-pill border border-primary/20 px-5 py-2 text-sm font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
                >
                  Open investor chat
                </button>
              ) : null}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => navigate(`/groups/${groupId}/admin`)}
                  className="w-full rounded-pill border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary/60 hover:text-primary"
                >
                  Admin portal
                </button>
              ) : null}
              <p className="text-xs text-slate-500">
                Investors receive onboarding emails confirming membership and access to governance, payment tracking,
                and architectural design galleries once approved.
              </p>
            </div>
          </div>
        </section>

        {isAdmin ? (
          <section className="mt-12 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Membership applications</h2>
                <p className="text-xs text-slate-500">
                  Review investor readiness submissions, confirm onboarding, and leave notes for compliance follow-up.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-pill bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {pendingApplications.length} awaiting action
                </span>
                <button
                  type="button"
                  onClick={handleSyncApplications}
                  disabled={applicationsLoading}
                  className="rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {applicationsLoading ? 'Syncing...' : 'Sync applications'}
                </button>
              </div>
            </div>

            {applicationsError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
                {applicationsError}
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {applicationsLoading && pendingApplications.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                    <p className="text-xs font-medium text-slate-500">Loading membership applications...</p>
                  </div>
                ) : null}

                {!applicationsLoading && pendingApplications.length === 0 && !applicationsError ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
                    All caught up. New investor applications will appear here for your review.
                  </div>
                ) : null}

                {pendingApplications.map((application) => {
                  const statusMeta = applicationStatusMeta[application.status] || applicationStatusMeta.pending;
                  const decisionPending = reviewSubmittingId === application.id;
                  return (
                    <article
                      key={application.id}
                      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card transition duration-150 ease-in-out hover:border-primary/30 hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{application.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {application.email}
                            {application.phone_number ? ` • ${application.phone_number}` : ''}
                          </p>
                          <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">
                            Application #{application.application_number?.slice(0, 8) || '—'} · Submitted{' '}
                            {formatDateTime(application.created_at)}
                          </p>
                        </div>
                        <span className={clsx('rounded-pill border px-3 py-1 text-xs font-semibold', statusMeta.tone)}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="font-semibold text-slate-700">Location</p>
                          <p>{application.location || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Occupation</p>
                          <p>{formatStatusLabel(application.occupation)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Installments</p>
                          <p>
                            {installmentLabels[application.installment_option] ||
                              formatStatusLabel(application.installment_option)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Payment deadline</p>
                          <p>{formatDateTime(application.payment_deadline, { includeTime: false })}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Financial readiness</p>
                          <p>{application.financial_ready ? 'Confirmed' : 'Not confirmed'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">Commitment confirmed</p>
                          <p>{application.commitment_confirmation ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      {application.motivation ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-700">Motivation</p>
                          <p className="mt-1 whitespace-pre-wrap">{application.motivation}</p>
                        </div>
                      ) : null}
                      {application.skills ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-700">Skills &amp; contributions</p>
                          <p className="mt-1 whitespace-pre-wrap">{application.skills}</p>
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {application.proof_of_funds ? (
                          <a
                            href={application.proof_of_funds}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
                          >
                            View bank statement
                          </a>
                        ) : null}
                        {application.status !== 'review' ? (
                          <button
                            type="button"
                            onClick={() => handleReviewDecision(application.id, 'review')}
                            disabled={decisionPending}
                            className="rounded-pill border border-sky-200 px-4 py-2 text-xs font-semibold text-sky-600 transition duration-150 ease-in-out hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            {decisionPending ? 'Updating...' : 'Mark under review'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleReviewDecision(application.id, 'approved')}
                          disabled={decisionPending}
                          className="rounded-pill bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {decisionPending ? 'Saving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewDecision(application.id, 'rejected')}
                          disabled={decisionPending}
                          className="rounded-pill bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {decisionPending ? 'Saving...' : 'Reject'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
                <p className="text-sm font-semibold text-slate-900">Recent decisions</p>
                <p className="mt-1 text-xs text-slate-500">
                  Track the latest approvals or declines for compliance handovers.
                </p>
                <div className="mt-4 space-y-3">
                  {recentDecisions.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-4 text-xs text-slate-500">
                      Once you approve or reject applications, summaries will appear here.
                    </p>
                  ) : (
                    recentDecisions.map((application) => {
                      const statusMeta = applicationStatusMeta[application.status] || applicationStatusMeta.pending;
                      return (
                        <div
                          key={application.id}
                          className="rounded-2xl border border-slate-100 bg-white/60 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-slate-700">{application.name}</p>
                            <span
                              className={clsx(
                                'rounded-pill border px-3 py-1 text-[11px] font-semibold',
                                statusMeta.tone,
                              )}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Updated {formatDateTime(application.reviewed_at || application.updated_at)}
                          </p>
                          {application.notes ? (
                            <p className="mt-2 text-[11px] text-slate-500 line-clamp-3">{application.notes}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Projects</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{projects.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              {statusBuckets.active} active - {statusBuckets.funding} funding - {statusBuckets.completed} completed
            </p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Co-investors</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalProjectInvestors}</p>
            <p className="mt-1 text-xs text-slate-500">Investors across every project in this group</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Design assets</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalDesignAssets}</p>
            <p className="mt-1 text-xs text-slate-500">Shared across all projects</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Governance</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{openProposalsCount}</p>
            <p className="mt-1 text-xs text-slate-500">Open proposals awaiting investor votes</p>
          </div>
        </section>
        <section className="mt-12 space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Projects under this group</h2>
              <p className="text-xs text-slate-500">
                Track each development, their funding outlook, and the number of design references shared with members.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
              No projects are linked to this group yet. Group administrators can onboard a project to activate investor
              updates and architectural design galleries.
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {projects.map((project) => {
                const assets = designAssetsByProject[project.id] || [];
                return (
                  <article
                    key={project.id}
                    className="flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition duration-200 ease-in-out hover:border-primary/30 hover:shadow-lg"
                  >
                    {project.featured_image ? (
                      <div className="h-40 w-full overflow-hidden bg-slate-100">
                        <img
                          src={sanitizeUrl(project.featured_image)}
                          alt={project.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                            {project.group_name || 'Group project'}
                          </p>
                          <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                        </div>
                        <span className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {formatStatusLabel(project.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {project.summary || project.description || 'No summary has been provided yet.'}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
                      <p>
                        <span className="text-slate-400">Investors.</span>{' '}
                        <span className="font-semibold text-slate-900">{project.active_investors || 0} co-investors</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Investment:</span>{' '}
                        <span className="font-semibold text-slate-900">Undisclosed</span>
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-slate-900">{project.location || 'To be confirmed'}</p>
                        <p>Location</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-slate-900">{assets.length}</p>
                        <p>Design assets shared</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        to={`/groups/${group?.id}/projects/${project.id}`}
                        className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition duration-150 ease-in-out hover:bg-primary/90"
                      >
                        View detail
                      </Link>
                      {assets.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openLightbox(project.id, 0)}
                          className="rounded-pill border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition duration-150 ease-in-out hover:border-primary hover:text-primary/90"
                        >
                          View design gallery
                        </button>
                      ) : null}
                    </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Group documents</h2>
              <p className="text-xs text-slate-500">
                Architectural drawings, BOQs, and legal PDFs shared by the group admin.
              </p>
            </div>
            <GroupDocumentManager
              groupId={group?.id}
              isAdmin={isAdmin}
              onUploaded={async () => {
                await loadGroupDocuments({ silent: true });
                setFeedback({
                  type: 'success',
                  message: 'Group document uploaded. Members can now download it.',
                });
              }}
            />
          </div>

          {documentsError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {documentsError}
            </div>
          ) : null}

          {documentsLoading ? (
            <div className="rounded-3xl border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-card">
              Loading group documents...
            </div>
          ) : null}

          {!documentsLoading && documents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
              No documents have been shared yet. Admins can upload architectural drawings, BOQs, and legal PDFs for
              members.
            </div>
          ) : null}

          {documents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((document) => {
                const title = document.title || (document.file ? document.file.split('/').pop() : 'Document');
                const typeLabel = documentTypeLabels[document.document_type] || 'Document';
                const uploadedBy =
                  document.uploaded_by?.full_name || document.uploaded_by?.email || 'Group admin';
                const uploadedAt = formatDateTime(document.uploaded_at, { includeTime: false });
                return (
                  <article
                    key={document.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-card"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{typeLabel}</p>
                      <h3 className="mt-2 text-base font-semibold text-slate-900">{title}</h3>
                      <p className="mt-2 text-xs text-slate-500">
                        Uploaded by {uploadedBy} - {uploadedAt}
                      </p>
                    </div>
                    {document.file ? (
                      <a
                        href={document.file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition duration-150 ease-in-out hover:border-primary hover:text-primary"
                      >
                        Download document
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No file available</span>
                    )}
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Architectural design library</h2>
              <p className="text-xs text-slate-500">
                Floor plans, elevations, renderings, and walkthroughs uploaded by the group admin to guide investors.
              </p>
            </div>
            <DesignAssetManager
              projects={projects}
              isAdmin={isAdmin}
              onCreated={(projectId) => {
                refreshProjectDesignAssets(projectId);
                setFeedback({
                  type: 'success',
                  message: 'Design asset uploaded. Investors can now explore it in the gallery.',
                });
              }}
            />
          </div>

          {designAssetsError ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {designAssetsError}
            </div>
          ) : null}

          {designAssetsLoading ? (
            <div className="rounded-3xl border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-card">
              Loading design assets...
            </div>
          ) : null}

          {!designAssetsLoading && galleryProjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
              No architectural assets have been published yet. Group administrators can upload images or video embeds to
              help members visualise the proposed development.
            </div>
          ) : null}

          <div className="space-y-8">
            {galleryProjects.map((entry) => (
              <div key={entry.project.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      {entry.project.name}
                    </p>
                    <h3 className="text-base font-semibold text-slate-900">
                      {entry.assets.length} design asset{entry.assets.length === 1 ? '' : 's'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLightbox(entry.project.id, 0)}
                    className="rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition duration-150 ease-in-out hover:border-primary hover:text-primary"
                  >
                    Open full-screen gallery
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {entry.assets.map((asset, index) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => openLightbox(entry.project.id, index)}
                      className="group relative flex h-56 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-card transition duration-200 ease-in-out hover:border-primary/30 hover:shadow-lg"
                    >
                      {asset.media_type === 'image' && asset.image ? (
                        <img
                          src={sanitizeUrl(asset.image)}
                          alt={asset.title}
                          className="h-40 w-full object-cover transition duration-200 ease-in-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white">
                          Video embed
                        </div>
                      )}
                      <div className="flex-1 space-y-1 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
                        {asset.description ? (
                          <p className="text-xs text-slate-500 line-clamp-2">{asset.description}</p>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Governance highlights</h2>
              <p className="text-xs text-slate-500">
                Latest proposals for this group's projects. Voting is restricted to approved investors.
              </p>
            </div>
            <span className="rounded-pill bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              {proposals.length} total proposals
            </span>
          </div>

          {proposalsForDisplay.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center text-sm text-slate-500">
              No proposals are currently published. Once governance items are uploaded, investors will be notified by
              email and see voting stats here.
            </div>
          ) : (
            <div className="space-y-4">
              {proposalsForDisplay.map((proposal) => {
                const votes = summariseVotes(proposal.votes);
                const totalVotes = votes.yes + votes.no + votes.abstain;
                return (
                  <article
                    key={proposal.id}
                    className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card transition duration-150 ease-in-out hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                          Proposal - {proposal.project ? `Project #${proposal.project}` : 'Unknown project'}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">{proposal.title}</h3>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                          {proposal.description || 'No description provided.'}
                        </p>
                        <p className="mt-3 text-xs text-slate-400">
                          Created {new Date(proposal.created_at || Date.now()).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                          {proposal.voting_deadline
                            ? ` - Voting deadline ${new Date(proposal.voting_deadline).toLocaleString(undefined, {
                                dateStyle: 'medium',
                              })}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        <span className="rounded-pill bg-white px-3 py-1 text-center text-xs font-semibold text-slate-600">
                          Status: {formatStatusLabel(proposal.status)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-emerald-600">Yes {votes.yes}</span>
                          <span className="font-semibold text-rose-500">No {votes.no}</span>
                          <span className="font-semibold text-slate-500">Abstain {votes.abstain}</span>
                        </div>
                        <p>Total votes: {totalVotes}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DesignAssetLightbox
        open={lightbox.open}
        project={currentProjectEntry?.project || null}
        asset={currentAsset || null}
        onClose={closeLightbox}
        onPrevAsset={handlePrevAsset}
        onNextAsset={handleNextAsset}
        onPrevProject={handlePrevProject}
        onNextProject={handleNextProject}
        hasPrevAsset={Boolean(hasPrevAsset)}
        hasNextAsset={Boolean(hasNextAsset)}
        hasPrevProject={hasPrevProject}
        hasNextProject={hasNextProject}
        canDelete={isAdmin}
        onDelete={isAdmin ? handleDeleteAsset : undefined}
      />
    </InvestorLayout>
  );
};

export default GroupDetailPage;
