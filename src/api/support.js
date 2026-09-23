import { apiRequest } from './client';

export const sendHelpChatMessage = (message, history = []) =>
  apiRequest('/api/v1/support/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
    // Gemini's generateContent call alone can take 6-11s+, and the backend
    // now retries transient failures up to 3 times (see support/gemini.py)
    // — worst case ~38s. The client's default 10s axios timeout (see
    // client.js) would abort this request before the backend could ever
    // finish, which surfaces as a null error.payload (no HTTP response was
    // received at all) and always falls back to the generic "unavailable"
    // message in HelpChatWidget regardless of what the backend returned.
    timeout: 45000,
  });
