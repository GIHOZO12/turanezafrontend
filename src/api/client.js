import axios from 'axios';

const inferLocalApiBase = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  const { hostname, port } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocalHost && port !== '8000') {
    return `http://${hostname}:8000`;
  }
  return window.location.origin;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || inferLocalApiBase();
const REFRESH_PATH = '/api/v1/users/token/refresh/';

// The access token lives in memory only (never localStorage/cookies) to
// minimise what a generic XSS payload can exfiltrate. It's lost on page
// reload by design; apiRequest() transparently restores it via the httpOnly
// refresh cookie (which JS can never read directly) on the first request
// after a reload — see eligibleForRefresh below.
let inMemoryAccessToken = null;

export const getAccessToken = () => inMemoryAccessToken;
export const setAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};
export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // sends the httpOnly refresh cookie
  headers: {
    Accept: 'application/json',
  },
});

const extractErrorMessage = (data) => {
  if (!data) {
    return null;
  }
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    return extractErrorMessage(data[0]);
  }
  if (typeof data === 'object') {
    if (data.error) {
      return extractErrorMessage(data.error);
    }
    if (data.detail) {
      return extractErrorMessage(data.detail);
    }
    for (const value of Object.values(data)) {
      const message = extractErrorMessage(value);
      if (message) {
        return message;
      }
    }
  }
  return null;
};

const toError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    const message = extractErrorMessage(data) || 'Unexpected error. Please try again.';
    const normalisedError = new Error(message);
    normalisedError.status = status;
    normalisedError.payload = data;
    return normalisedError;
  }

  const message =
    error.request?.status === 0
      ? 'Network error. Please check your connection.'
      : error.message || 'Unexpected error. Please try again.';
  const normalisedError = new Error(message);
  normalisedError.status = error.request?.status;
  normalisedError.payload = null;
  return normalisedError;
};

// The refresh token itself is never visible to JS (httpOnly cookie, sent
// automatically via withCredentials). Refresh-token rotation is enabled
// server-side, so concurrent 401s must all await the SAME refresh call.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = http
      .post(REFRESH_PATH, null)
      .then((response) => {
        setAccessToken(response.data.access);
        return response.data;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Endpoints where a 401 should never trigger a refresh-and-retry: the
// pre-auth flows (bad credentials/invalid code are expected 401s here, not a
// stale-token situation) and the refresh endpoint itself (would recurse).
const REFRESH_EXEMPT_PATHS = new Set([
  '/api/v1/users/login/',
  '/api/v1/users/signup/',
  '/api/v1/users/google/',
  '/api/v1/users/verify/',
  '/api/v1/users/resend/',
  '/api/v1/users/password-reset/',
  '/api/v1/users/password-reset/confirm/',
  REFRESH_PATH,
]);

export const apiRequest = async (path, options = {}) => {
  const { headers: customHeaders, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const buildConfig = () => {
    const config = {
      url: path,
      method: rest.method || 'GET',
      headers: {
        ...http.defaults.headers.common,
        ...customHeaders,
      },
      ...rest,
    };

    if (isFormData && body) {
      config.data = body;
      delete config.headers['Content-Type'];
    } else if (typeof body !== 'undefined' && body !== null) {
      config.data = body;
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }

    // Don't override an explicit Authorization header a caller already set
    // (e.g. the super-admin panel's separate Basic-Auth mechanism).
    if (!config.headers.Authorization) {
      const accessToken = getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  };

  const config = buildConfig();
  // Only skip the refresh attempt when a caller set an explicit NON-Bearer
  // Authorization header (e.g. super-admin's Basic Auth) — a missing or
  // Bearer Authorization header both mean "try restoring the session via the
  // httpOnly refresh cookie," which is what lets a page reload transparently
  // restore a valid session before any access token exists in memory yet.
  const hasExplicitNonBearerAuth = Boolean(config.headers.Authorization) && !config.headers.Authorization.startsWith('Bearer ');
  const eligibleForRefresh = !REFRESH_EXEMPT_PATHS.has(path) && !hasExplicitNonBearerAuth;

  try {
    const response = await http(config);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 && eligibleForRefresh) {
      try {
        await refreshAccessToken();
        const retryResponse = await http(buildConfig());
        return retryResponse.data;
      } catch (retryError) {
        throw toError(retryError);
      }
    }
    throw toError(error);
  }
};
