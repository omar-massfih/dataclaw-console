import type { ApiResponse } from '../types/api';
import { getEnv } from './env';

type RequestOptions = RequestInit & {
  parseAs?: 'json' | 'text';
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { apiBaseUrl } = getEnv();
  const { parseAs = 'json', headers, ...requestInit } = options;

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...requestInit,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: `Request failed with status ${response.status}`,
          status: response.status,
        },
      };
    }

    const payload =
      parseAs === 'text'
        ? ((await response.text()) as T)
        : ((await response.json()) as T);

    return { data: payload, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown request error',
      },
    };
  }
}
