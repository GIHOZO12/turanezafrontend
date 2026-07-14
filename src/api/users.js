import { apiRequest } from './client';

const USERS_ROOT = '/api/v1/users';

export const signupUser = (payload) =>
  apiRequest(`${USERS_ROOT}/signup/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const verifyEmail = (payload) =>
  apiRequest(`${USERS_ROOT}/verify/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

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
  });

export const loginWithGoogle = (payload) =>
  apiRequest(`${USERS_ROOT}/google/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const logoutUser = () =>
  apiRequest(`${USERS_ROOT}/logout/`, {
    method: 'POST',
  });

export const fetchCurrentUser = () =>
  apiRequest(`${USERS_ROOT}/me/`, {
    method: 'GET',
  });

export const updateCurrentUser = (payload) =>
  apiRequest(`${USERS_ROOT}/me/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
