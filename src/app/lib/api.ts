// Thin REST client for the Payment Insight API. Attaches the Cognito ID token
// and transparently refreshes it once on a 401.
import { awsConfig } from './awsConfig';
import { getTokens, refresh, signOut } from './cognito';

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (tokens?.idToken) headers.authorization = `Bearer ${tokens.idToken}`;

  const res = await fetch(`${awsConfig.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    if (await refresh()) return request<T>(method, path, body, false);
    signOut();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
};
