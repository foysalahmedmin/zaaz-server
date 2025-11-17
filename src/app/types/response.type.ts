export type TResponse<T> = {
  status: number;
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
};
