import { apiRequest } from './client';

export const sendHelpChatMessage = (message, history = []) =>
  apiRequest('/api/v1/support/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
    // Gemini's generateContent call alone can take 6-11s+, and the backend
    // allows up to 15s waiting on it — the client's default 10s axios
    // timeout (see client.js) was aborting this request client-side before
    // the backend could ever respond, which surfaces as a null error.payload
    // (no HTTP response was received at all) and always falls back to the
    // generic "unavailable" message in HelpChatWidget, no matter what the
    // backend actually returned.
    timeout: 30000,
  });
