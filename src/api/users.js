import { apiRequest, setTokens, clearTokens, getRefreshToken } from './client';

const USERS_ROOT = '/api/v1/users';

const storeTokensFromResponse = (data) => {
  if (data?.access && data?.refresh) {
    setTokens({ access: data.access, refresh: data.refresh });
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
  }).then(storeTokensFromResponse);

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
  }).then(storeTokensFromResponse);

export const loginWithGoogle = (payload) =>
  apiRequest(`${USERS_ROOT}/google/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(storeTokensFromResponse);

export const logoutUser = async () => {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiRequest(`${USERS_ROOT}/logout/`, {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });
    }
  } finally {
    clearTokens();
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
