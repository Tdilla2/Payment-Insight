// Minimal Cognito auth client (USER_PASSWORD_AUTH) using the IDP REST API —
// avoids pulling in a large SDK. Stores tokens in localStorage.
import { awsConfig } from './awsConfig';

const IDP = `https://cognito-idp.${awsConfig.region}.amazonaws.com/`;
const TOKEN_KEY = 'pi_tokens';

interface Tokens { idToken: string; accessToken: string; refreshToken: string; }

async function idp(target: string, body: unknown): Promise<any> {
  const res = await fetch(IDP, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || 'auth error');
  return data;
}

export function getTokens(): Tokens | null {
  try { const t = localStorage.getItem(TOKEN_KEY); return t ? JSON.parse(t) : null; } catch { return null; }
}
function setTokens(t: Tokens) { localStorage.setItem(TOKEN_KEY, JSON.stringify(t)); }
export function clearTokens() { localStorage.removeItem(TOKEN_KEY); }

export type SignInResult =
  | { status: 'ok' }
  | { status: 'new_password_required'; session: string; email: string };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const data = await idp('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: awsConfig.cognitoClientId,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return { status: 'new_password_required', session: data.Session, email };
  }
  storeAuthResult(data.AuthenticationResult);
  return { status: 'ok' };
}

export async function completeNewPassword(email: string, newPassword: string, session: string): Promise<void> {
  const data = await idp('RespondToAuthChallenge', {
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    ClientId: awsConfig.cognitoClientId,
    Session: session,
    ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
  });
  storeAuthResult(data.AuthenticationResult);
}

function storeAuthResult(r: any) {
  setTokens({ idToken: r.IdToken, accessToken: r.AccessToken, refreshToken: r.RefreshToken });
}

export async function refresh(): Promise<boolean> {
  const t = getTokens();
  if (!t?.refreshToken) return false;
  try {
    const data = await idp('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: awsConfig.cognitoClientId,
      AuthParameters: { REFRESH_TOKEN: t.refreshToken },
    });
    const r = data.AuthenticationResult;
    setTokens({ idToken: r.IdToken, accessToken: r.AccessToken, refreshToken: t.refreshToken });
    return true;
  } catch { return false; }
}

export function signOut() { clearTokens(); }
