import { apiRequest, setAccessToken, clearAccessToken } from './client';

const USERS_ROOT = '/api/v1/users';

// The refresh token is never in this response body — it's set directly as an
// httpOnly cookie by the backend, invisible to JS. Only the access token is
// handed to us, and it's kept in memory only (see client.js).
const storeAccessTokenFromResponse = (data) => {
  if (data?.access) {
    setAccessToken(data.access);
  }
  return data;
};

export const signupUser = (payload) =>
  apiRequest(`${USERS_ROOT}/signup/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyEmail = (payload) =>
  apiRequest(`${USERS_ROOT}/verify/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(storeAccessTokenFromResponse);

export const resendVerification = (payload) =>
  apiRequest(`${USERS_ROOT}/resend/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestPasswordReset = (payload) =>
  apiRequest(`${USERS_ROOT}/password-reset/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const confirmPasswordReset = (payload) =>
  apiRequest(`${USERS_ROOT}/password-reset/confirm/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const loginUser = (payload) =>
  apiRequest(`${USERS_ROOT}/login/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(storeAccessTokenFromResponse);

export const loginWithGoogle = (payload) =>
  apiRequest(`${USERS_ROOT}/google/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(storeAccessTokenFromResponse);

export const logoutUser = async () => {
  try {
    // No body needed — the backend reads the refresh token from the httpOnly
    // cookie (sent automatically) and clears it server-side.
    await apiRequest(`${USERS_ROOT}/logout/`, {
      method: 'POST',
    });
  } finally {
    clearAccessToken();
  }
};

export const fetchCurrentUser = () =>
  apiRequest(`${USERS_ROOT}/me/`, {
    method: 'GET',
  });

export const updateCurrentUser = (payload) =>
  apiRequest(`${USERS_ROOT}/me/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const setPassword = (payload) =>
  apiRequest(`${USERS_ROOT}/set-password/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
