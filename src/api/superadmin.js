import { apiRequest } from './client';

const getBasicAuth = () => {
  try {
    const raw = localStorage.getItem('superadmin-basic');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.username && parsed?.password) {
      const token = btoa(`${parsed.username}:${parsed.password}`);
      return { Authorization: `Basic ${token}` };
    }
    return null;
  } catch (error) {
    return null;
  }
};

const withAuthHeaders = (headers = {}) => {
  const auth = getBasicAuth();
  return auth ? { ...headers, ...auth } : headers;
};

export const saveSuperAdminCreds = ({ username, password }) => {
  localStorage.setItem('superadmin-basic', JSON.stringify({ username, password }));
};

export const clearSuperAdminCreds = () => {
  localStorage.removeItem('superadmin-basic');
};

export const fetchSuperAdminMe = () =>
  apiRequest('/api/v1/super-admin/me/', {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminDashboard = () =>
  apiRequest('/api/v1/super-admin/dashboard/', {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const logoutSuperAdmin = () => {
  clearSuperAdminCreds();
  return apiRequest('/api/v1/super-admin/logout/', {
    method: 'POST',
    headers: withAuthHeaders(),
  });
};

export const fetchPaymentProofs = () =>
  apiRequest('/api/v1/super-admin/payment-proofs/', {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchPaymentProof = (id) =>
  apiRequest(`/api/v1/super-admin/payment-proofs/${id}/`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const approvePaymentProof = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/payment-proofs/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const rejectPaymentProof = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/payment-proofs/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const flutterwavePaymentProof = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/payment-proofs/${id}/set_status/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const verifyBankProof = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/payment-proofs/${id}/verify_bank/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminUsers = () =>
  apiRequest('/api/v1/super-admin/users/', {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const suspendSuperAdminUser = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/users/${id}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const reinstateSuperAdminUser = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/users/${id}/reinstate/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const promoteSuperAdminUser = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/users/${id}/promote-tier/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminGroups = () =>
  apiRequest('/api/v1/super-admin/groups/', {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminGroup = (id) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const freezeSuperAdminGroup = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/freeze/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const unfreezeSuperAdminGroup = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/unfreeze/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const suspendSuperAdminGroup = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const replaceGroupAdmin = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/replace-admin/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const unmarkGroupAdmin = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/unmark-admin/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const addGroupInvestor = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/add-investor/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const removeGroupInvestor = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/remove-investor/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const postGroupAnnouncement = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/groups/${id}/announce/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminChats = (params = '') =>
  apiRequest(`/api/v1/super-admin/chats/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminAuditLogs = (params = '') =>
  apiRequest(`/api/v1/super-admin/audit-logs/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminInvestmentInterestSubmissions = (params = '') =>
  apiRequest(`/api/v1/super-admin/landing-investment-interests/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminContactSubmissions = (params = '') =>
  apiRequest(`/api/v1/super-admin/landing-contact-submissions/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const submitLandingInvestmentInterest = (payload = {}) =>
  apiRequest('/api/v1/super-admin/public/investment-interest/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitLandingContactForm = (payload = {}) =>
  apiRequest('/api/v1/super-admin/public/contact/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchComplianceSubmissions = (params = '') =>
  apiRequest(`/api/v1/super-admin/compliance/submissions/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const approveComplianceSubmission = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/compliance/submissions/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const rejectComplianceSubmission = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/compliance/submissions/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const requestInfoComplianceSubmission = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/compliance/submissions/${id}/request-info/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const previewComplianceSubmission = (id) =>
  apiRequest(`/api/v1/super-admin/compliance/submissions/${id}/preview/`, {
    method: 'GET',
    headers: withAuthHeaders(),
    responseType: 'blob',
  });

export const fetchPlotSubmissionsForReview = (params = '') =>
  apiRequest(`/api/v1/super-admin/plots/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const approvePlotSubmission = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/plots/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const rejectPlotSubmission = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/plots/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const createGroupForPlot = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/plots/${id}/create-group/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const previewPlotOwnershipProof = (id) =>
  apiRequest(`/api/v1/super-admin/plots/${id}/preview/`, {
    method: 'GET',
    headers: withAuthHeaders(),
    responseType: 'blob',
  });

export const fetchPlotJoinRequests = (params = '') =>
  apiRequest(`/api/v1/super-admin/plot-join-requests/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const approvePlotJoinRequest = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/plot-join-requests/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const rejectPlotJoinRequest = (id, payload = {}) =>
  apiRequest(`/api/v1/super-admin/plot-join-requests/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const previewJoinRequestProofOfFunds = (id) =>
  apiRequest(`/api/v1/super-admin/plot-join-requests/${id}/preview-proof-of-funds/`, {
    method: 'GET',
    headers: withAuthHeaders(),
    responseType: 'blob',
  });

export const previewJoinRequestCriminalRecord = (id) =>
  apiRequest(`/api/v1/super-admin/plot-join-requests/${id}/preview-criminal-record/`, {
    method: 'GET',
    headers: withAuthHeaders(),
    responseType: 'blob',
  });

export const previewJoinRequestCommitmentFeeProof = (id) =>
  apiRequest(`/api/v1/super-admin/plot-join-requests/${id}/preview-commitment-fee-proof/`, {
    method: 'GET',
    headers: withAuthHeaders(),
    responseType: 'blob',
  });

export const fetchSuperAdminProjects = (params = '') =>
  apiRequest(`/api/v1/super-admin/projects/${params}`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const fetchSuperAdminProject = (id) =>
  apiRequest(`/api/v1/super-admin/projects/${id}/`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const createSuperAdminProject = (payload) =>
  apiRequest('/api/v1/super-admin/projects/', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const updateSuperAdminProject = (id, payload) =>
  apiRequest(`/api/v1/super-admin/projects/${id}/`, {
    method: 'PATCH',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const deleteSuperAdminProject = (id) =>
  apiRequest(`/api/v1/super-admin/projects/${id}/`, {
    method: 'DELETE',
    headers: withAuthHeaders(),
  });

// Dedicated super-admin-scoped design-asset endpoints (Basic Auth, same
// permission class as the other /api/v1/super-admin/* routes) — the plain
// /api/v1/projects/designs/ endpoint is JWT-only and always rejects Basic
// Auth, so it can't be reused here.
export const fetchSuperAdminProjectDesignAssets = (projectId) =>
  apiRequest(`/api/v1/super-admin/projects/${projectId}/design-assets/`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const createSuperAdminProjectDesignAsset = (projectId, formData) =>
  apiRequest(`/api/v1/super-admin/projects/${projectId}/design-assets/`, {
    method: 'POST',
    body: formData,
    headers: withAuthHeaders(),
  });

export const deleteSuperAdminProjectDesignAsset = (assetId) =>
  apiRequest(`/api/v1/super-admin/design-assets/${assetId}/`, {
    method: 'DELETE',
    headers: withAuthHeaders(),
  });

// Dedicated super-admin-scoped group-document endpoints (Basic Auth) — the
// plain /api/v1/groups/documents/ endpoint is JWT-only and always rejects
// Basic Auth, same reasoning as the design-asset endpoints above.
export const fetchSuperAdminGroupDocuments = (groupId) =>
  apiRequest(`/api/v1/super-admin/groups/${groupId}/documents/`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const createSuperAdminGroupDocument = (groupId, formData) =>
  apiRequest(`/api/v1/super-admin/groups/${groupId}/documents/`, {
    method: 'POST',
    body: formData,
    headers: withAuthHeaders(),
  });

export const deleteSuperAdminGroupDocument = (documentId) =>
  apiRequest(`/api/v1/super-admin/documents/${documentId}/`, {
    method: 'DELETE',
    headers: withAuthHeaders(),
  });

// Dedicated super-admin-scoped governance-proposal endpoints (Basic Auth) —
// the plain /api/v1/governance/proposals/ endpoint is JWT-only, same
// reasoning as the design-asset endpoints above.
export const fetchSuperAdminProjectProposals = (projectId) =>
  apiRequest(`/api/v1/super-admin/projects/${projectId}/proposals/`, {
    method: 'GET',
    headers: withAuthHeaders(),
  });

export const createSuperAdminProjectProposal = (projectId, payload = {}) =>
  apiRequest(`/api/v1/super-admin/projects/${projectId}/proposals/`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: withAuthHeaders(),
  });

export const deleteSuperAdminProjectProposal = (proposalId) =>
  apiRequest(`/api/v1/super-admin/proposals/${proposalId}/`, {
    method: 'DELETE',
    headers: withAuthHeaders(),
  });
