import { apiRequest } from './client';

const GOVERNANCE_ROOT = '/api/v1/governance';

export const fetchProposals = () =>
  apiRequest(`${GOVERNANCE_ROOT}/proposals/`, {
    method: 'GET',
  });

