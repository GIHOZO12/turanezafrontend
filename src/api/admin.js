import { apiRequest } from './client';
import { toQueryString } from './utils';

const ADMIN_ROOT = '/api/v1/admin';

export const fetchAdminDashboard = () =>
  apiRequest(`${ADMIN_ROOT}/dashboard/`, {
    method: 'GET',
  });

export const fetchAdminUsers = (params = {}) =>
  apiRequest(`${ADMIN_ROOT}/users/${toQueryString(params)}`, {
    method: 'GET',
  });

export const updateAdminUser = (userId, payload) =>
  apiRequest(`${ADMIN_ROOT}/users/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

