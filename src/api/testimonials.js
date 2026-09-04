import { apiRequest, API_BASE_URL } from './client';
import { sanitizeUrl } from '../utils/url';

export const fetchTestimonials = () =>
  apiRequest('/api/v1/testimonials/get-testimonials/', {
    method: 'GET',
  });

export const resolveTestimonialImageUrl = (path) => {
  if (!path) {
    return null;
  }
  const clean = sanitizeUrl(path);
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  return `${API_BASE_URL}${clean.startsWith('/') ? '' : '/'}${clean}`;
};
