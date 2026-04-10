import axios from 'axios';
import { env } from '../config/env';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_DEVICEID_KEY } from '../context/AuthContext';

const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const deviceId = localStorage.getItem(AUTH_USER_DEVICEID_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Request failed';
    const normalizedError = new Error(message) as Error & {
      responseData?: unknown;
      status?: number;
    };

    normalizedError.responseData = error?.response?.data;
    normalizedError.status = error?.response?.status;

    return Promise.reject(normalizedError);
  }
);

export default axiosInstance;
