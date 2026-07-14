import { apiRequest } from './client';

const ACTIVITY_ROOT = '/api/v1/activity';

export const fetchActivities = () =>
  apiRequest(`${ACTIVITY_ROOT}/activities/`, {
    method: 'GET',
  });

export const postActivity = (payload) =>
  apiRequest(`${ACTIVITY_ROOT}/activities/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

