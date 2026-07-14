import { apiRequest } from './client';
import { toQueryString } from './utils';

const COMPLIANCE_ROOT = '/api/v1/compliance';

export const fetchComplianceChecks = (params = {}) =>
  apiRequest(`${COMPLIANCE_ROOT}/checks/${toQueryString(params)}`, {
    method: 'GET',
  });

export const updateComplianceCheck = (checkId, payload) =>
  apiRequest(`${COMPLIANCE_ROOT}/checks/${checkId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const fetchDocuments = (params = {}) =>
  apiRequest(`${COMPLIANCE_ROOT}/documents/${toQueryString(params)}`, {
    method: 'GET',
  });

export const uploadDocument = (formData) =>
  apiRequest(`${COMPLIANCE_ROOT}/documents/`, {
    method: 'POST',
    body: formData,
  });

export const deleteDocument = (documentId) =>
  apiRequest(`${COMPLIANCE_ROOT}/documents/${documentId}/`, {
    method: 'DELETE',
  });

export const fetchComplianceRequirements = () =>
  apiRequest(`${COMPLIANCE_ROOT}/requirements/`, {
    method: 'GET',
  });

export const uploadComplianceRequirement = (formData) =>
  apiRequest(`${COMPLIANCE_ROOT}/upload/`, {
    method: 'POST',
    body: formData,
  });

export const fetchMyComplianceSubmissions = () =>
  apiRequest(`${COMPLIANCE_ROOT}/my-submissions/`, {
    method: 'GET',
  });
