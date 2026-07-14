import { apiRequest } from './client';

const DASHBOARD_ROOT = '/api/v1/users/dashboard';

export const fetchDashboardSnapshot = () =>
  apiRequest(`${DASHBOARD_ROOT}/`, {
    method: 'GET',
  });

