export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiFailure {
  data: null;
  error: {
    message: string;
    code?: string;
    status?: number;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
