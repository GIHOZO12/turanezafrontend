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

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = ({ access, refresh } = {}) => {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// Refresh-token rotation is enabled server-side: every call to REFRESH_PATH
// invalidates the refresh token sent and returns a new one. If several
// requests 401 at once, they must all await the SAME refresh call rather than
// each spending (and invalidating) the refresh token independently.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken();
    refreshPromise = http
      .post(REFRESH_PATH, { refresh: refreshToken })
      .then((response) => {
        setTokens(response.data);
        return response.data;
      })
      .catch((error) => {
        clearTokens();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

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
  const wasBearerAuthed = Boolean(config.headers.Authorization?.startsWith('Bearer ')) && path !== REFRESH_PATH;

  try {
    const response = await http(config);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 && wasBearerAuthed && getRefreshToken()) {
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
