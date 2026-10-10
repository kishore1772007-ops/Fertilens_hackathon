import axios from 'axios';
import { ROUTES } from '../constants/routes';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach Authorization Bearer token and CSRF token on outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const csrfToken = localStorage.getItem('csrf_token');
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token queue management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Normalize error message
    let errorMessage = 'An unexpected error occurred.';
    if (error.response?.data) {
      const { detail } = error.response.data;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI 422 validation error
        errorMessage = detail.map((err) => `${err.loc?.slice(-1)[0] || 'field'}: ${err.msg}`).join(', ');
      } else if (typeof detail === 'object') {
        errorMessage = JSON.stringify(detail);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    error.normalizedMessage = errorMessage;

    // Endpoints that should not trigger automated token refresh on 401
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/hospital/login') ||
      originalRequest?.url?.includes('/auth/patient/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout') ||
      originalRequest?.url?.includes('/auth/me');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (isRefreshing) {
        // Queue concurrent requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (newToken && originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshPayload = storedRefreshToken ? { refresh_token: storedRefreshToken } : {};
        const refreshHeaders = storedRefreshToken ? { Authorization: `Bearer ${storedRefreshToken}` } : {};

        const refreshRes = await apiClient.post('/auth/refresh', refreshPayload, {
          headers: refreshHeaders,
        });

        const newAccessToken = refreshRes.data?.access_token;
        if (newAccessToken) {
          localStorage.setItem('access_token', newAccessToken);
          if (refreshRes.data.refresh_token) {
            localStorage.setItem('refresh_token', refreshRes.data.refresh_token);
          }
          if (refreshRes.data.csrf_token) {
            localStorage.setItem('csrf_token', refreshRes.data.csrf_token);
          }
        }

        processQueue(null, newAccessToken);

        if (newAccessToken && originalRequest?.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('csrf_token');

        const isPublicRoute =
          window.location.pathname === ROUTES.LOGIN ||
          window.location.pathname === ROUTES.LOGIN_CHOOSER ||
          window.location.pathname === ROUTES.LOGIN_HOSPITAL ||
          window.location.pathname === ROUTES.LOGIN_PATIENT ||
          window.location.pathname === ROUTES.HOME ||
          window.location.pathname === ROUTES.UNAUTHORIZED;

        if (!isPublicRoute) {
          const isPatientRoute = window.location.pathname.startsWith('/patient');
          window.location.href = isPatientRoute ? ROUTES.LOGIN_PATIENT : ROUTES.LOGIN_HOSPITAL;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
