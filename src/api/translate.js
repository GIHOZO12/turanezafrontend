import { apiRequest } from './client';

/**
 * Translate text via backend proxy (Google Translate).
 * @param {{ text: string, target: string, source?: string }} params
 * @returns {Promise<{ translated_text: string, detected_source?: string, target: string }>}
 */
export const translateText = async ({ text, target, source }) => {
  if (!text || !target) {
    throw new Error('text and target are required');
  }
  return apiRequest('/api/v1/translate/', {
    method: 'POST',
    body: JSON.stringify({ text, target, source }),
  });
};

