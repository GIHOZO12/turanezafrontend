import { apiRequest } from './client';

export const sendHelpChatMessage = (message, history = []) =>
  apiRequest('/api/v1/support/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  });
