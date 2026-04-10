import { AxiosRequestConfig } from 'axios';
import axiosInstance from './axiosInstance';
import toast from 'react-hot-toast';

type RootApiErrorPayload = {
  success?: boolean;
  message?: string;
  mustChangePassword?: boolean;
};

type NormalizedApiError = Error & {
  responseData?: unknown;
  status?: number;
};

const extractRootPayload = (value: unknown): RootApiErrorPayload | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as RootApiErrorPayload;
  const hasKnownFlags = typeof source.success === 'boolean' || typeof source.message === 'string';

  return hasKnownFlags ? source : null;
};

const notifyRootError = (payload: RootApiErrorPayload, fallbackMessage: string): string => {
  const message = payload.message?.trim() || fallbackMessage;
  const toastMessage = payload.mustChangePassword
    ? `${message}. Please change your password to continue.`
    : message;

  toast.error(toastMessage);
  return message;
};

const handleResponseData = <TResponse>(data: TResponse): TResponse => {
  const rootPayload = extractRootPayload(data);

  if (rootPayload?.success === false) {
    const message = notifyRootError(rootPayload, 'Request failed');
    throw new Error(message);
  }

  return data;
};

const handleApiError = (error: unknown): never => {
  const normalizedError = error as NormalizedApiError;
  const rootPayload = extractRootPayload(normalizedError.responseData);

  if (rootPayload?.success === false || rootPayload?.mustChangePassword || rootPayload?.message) {
    const message = notifyRootError(rootPayload ?? {}, normalizedError.message || 'Request failed');
    throw new Error(message);
  }

  if (normalizedError?.message) {
    toast.error(normalizedError.message);
    throw normalizedError;
  }

  toast.error('Request failed');
  throw new Error('Request failed');
};

const executeRequest = async <TResponse>(request: Promise<{ data: TResponse }>): Promise<TResponse> => {
  try {
    const response = await request;
    return handleResponseData(response.data);
  } catch (error) {
    return handleApiError(error);
  }
};

export const api = {
  get: async <TResponse = unknown>(url: string, config?: AxiosRequestConfig) => {
    return executeRequest(axiosInstance.get<TResponse>(url, config));
  },
  post: async <TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig
  ) => {
    return executeRequest(axiosInstance.post<TResponse>(url, data, config));
  },
  put: async <TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig
  ) => {
    return executeRequest(axiosInstance.put<TResponse>(url, data, config));
  },
  patch: async <TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig
  ) => {
    return executeRequest(axiosInstance.patch<TResponse>(url, data, config));
  },
  delete: async <TResponse = unknown>(url: string, config?: AxiosRequestConfig) => {
    return executeRequest(axiosInstance.delete<TResponse>(url, config));
  },
};
