import axios from 'axios';
import type { GeneralResponse } from '../types';

export const isApiSuccess = <T>(response: GeneralResponse<T>): boolean =>
  response.success === true || response.status === 'success';

interface ApiErrorBody {
  message?: string;
  errors?: Array<{ msg?: string }>;
}

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError<ApiErrorBody>(err)) return fallback;

  const apiErrors = err.response?.data?.errors;
  const apiMessage = err.response?.data?.message;

  if (Array.isArray(apiErrors) && apiErrors.length > 0 && apiErrors[0]?.msg) {
    return apiErrors[0].msg;
  }

  return apiMessage || fallback;
};
