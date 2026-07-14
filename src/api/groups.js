import { apiRequest } from './client';
import { toQueryString } from './utils';

const GROUPS_ROOT = '/api/v1/groups';

export const fetchAllGroups = () =>
  apiRequest(`${GROUPS_ROOT}/groups/`, {
    method: 'GET',
  });

export const createGroup = (payload) =>
  apiRequest(`${GROUPS_ROOT}/groups/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchMemberships = (params = {}) =>
  apiRequest(`${GROUPS_ROOT}/memberships/${toQueryString(params)}`, {
    method: 'GET',
  });

export const joinGroupDirectly = (payload) =>
  apiRequest(`${GROUPS_ROOT}/memberships/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitGroupApplication = (formData) =>
  apiRequest(`${GROUPS_ROOT}/applications/`, {
    method: 'POST',
    body: formData,
  });

export const fetchGroupApplications = (params = {}) =>
  apiRequest(`${GROUPS_ROOT}/applications/${toQueryString(params)}`, {
    method: 'GET',
  });

export const reviewGroupApplication = (applicationId, payload) =>
  apiRequest(`${GROUPS_ROOT}/applications/${applicationId}/review/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchGroupApplicationById = (applicationId) =>
  apiRequest(`${GROUPS_ROOT}/applications/${applicationId}/`, {
    method: 'GET',
  });

export const submitCommitmentFeeProof = (applicationId, formData) =>
  apiRequest(`${GROUPS_ROOT}/applications/${applicationId}/commitment-fee/`, {
    method: 'POST',
    body: formData,
  });

export const fetchGroupById = (groupId) =>
  apiRequest(`${GROUPS_ROOT}/groups/${groupId}/`, {
    method: 'GET',
  });

export const fetchGroupMessages = (params = {}) =>
  apiRequest(`${GROUPS_ROOT}/messages/${toQueryString(params)}`, {
    method: 'GET',
  });

export const sendGroupMessage = (payload) =>
  apiRequest(`${GROUPS_ROOT}/messages/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchGroupDocuments = (groupId) =>
  apiRequest(`${GROUPS_ROOT}/documents/${toQueryString({ group: groupId })}`, {
    method: 'GET',
  });

export const createGroupDocument = (formData) =>
  apiRequest(`${GROUPS_ROOT}/documents/`, {
    method: 'POST',
    body: formData,
  });

export const fetchGroupPlanSuggestions = (groupId, payload) =>
  apiRequest(`${GROUPS_ROOT}/groups/${groupId}/plan-suggestions/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const submitPlotSubmission = (formData) =>
  apiRequest(`${GROUPS_ROOT}/plots/`, {
    method: 'POST',
    body: formData,
  });

export const fetchApprovedPlots = () =>
  apiRequest(`${GROUPS_ROOT}/plots/`, {
    method: 'GET',
  });

export const fetchMyPlotSubmissions = () =>
  apiRequest(`${GROUPS_ROOT}/plots/${toQueryString({ mine: 'true' })}`, {
    method: 'GET',
  });

export const fetchPlotById = (plotId) =>
  apiRequest(`${GROUPS_ROOT}/plots/${plotId}/`, {
    method: 'GET',
  });
