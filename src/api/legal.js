import { apiRequest } from './client';

export const legalApi = {
  listDocs: () =>
    apiRequest('/api/legal/documents/', {
      method: 'GET',
    }),
  getDoc: (slug) =>
    apiRequest(`/api/legal/documents/${slug}/`, {
      method: 'GET',
    }),
  myAcceptances: () =>
    apiRequest('/api/legal/my-acceptances/', {
      method: 'GET',
    }),
  accept: (slug, version) =>
    apiRequest('/api/legal/accept/', {
      method: 'POST',
      body: JSON.stringify({ slug, version }),
    }),
};
