import { buildPath } from './config';
import { clearToken, retrieveToken } from './tokenStorage';

export const authFetch = async (route: string, options: RequestInit = {}): Promise<Response> => {
  const token = retrieveToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildPath(route), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
  }

  return response;
};
