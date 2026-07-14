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

const getCsrfToken = () => {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
};

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

let csrfBootstrapPromise = null;

const ensureCsrfCookie = async () => {
  if (getCsrfToken()) {
    return;
  }
  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = http
      .get('/api/v1/users/csrf/')
      .catch((error) => {
        csrfBootstrapPromise = null;
        throw error;
      })
      .then(() => {
        csrfBootstrapPromise = null;
      });
  }
  await csrfBootstrapPromise;
};

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

export const apiRequest = async (path, options = {}) => {
  const { headers: customHeaders, body, credentials, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

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

  if (!/^(get|head|options|trace)$/i.test(config.method)) {
    await ensureCsrfCookie();
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }

  try {
    const response = await http(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = extractErrorMessage(data) || 'Unexpected error. Please try again.';
      const normalisedError = new Error(message);
      normalisedError.status = status;
      normalisedError.payload = data;
      throw normalisedError;
    }

    const message =
      error.request?.status === 0
        ? 'Network error. Please check your connection.'
        : error.message || 'Unexpected error. Please try again.';
    const normalisedError = new Error(message);
    normalisedError.status = error.request?.status;
    normalisedError.payload = null;
    throw normalisedError;
  }
};
