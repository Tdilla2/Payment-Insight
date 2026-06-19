import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env.AWS_REGION_NAME || process.env.AWS_REGION || 'us-east-1';
const pool = process.env.COGNITO_USER_POOL_ID!;
const cip = new CognitoIdentityProviderClient({ region });

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) { super(message); this.name = 'ConflictError'; }
}

// Create a user with a temporary password and add them to a group.
// A non-permanent password forces the NEW_PASSWORD_REQUIRED challenge at first login.
async function provisionUser(email: string, tempPassword: string, group: string): Promise<void> {
  try {
    await cip.send(new AdminCreateUserCommand({
      UserPoolId: pool,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS',
    }));
  } catch (e: any) {
    // Surface duplicates clearly instead of silently "succeeding".
    if (e?.name === 'UsernameExistsException') {
      throw new ConflictError('A user with that email already exists (it may be a client or another login).');
    }
    throw e;
  }
  // Only runs for a freshly-created user — never modifies an existing account.
  await cip.send(new AdminSetUserPasswordCommand({
    UserPoolId: pool, Username: email, Password: tempPassword, Permanent: false,
  }));
  await cip.send(new AdminAddUserToGroupCommand({
    UserPoolId: pool, Username: email, GroupName: group,
  }));
}

export const provisionClientUser = (email: string, tempPassword: string) =>
  provisionUser(email, tempPassword, 'client');

// Internal staff roles: 'admin' (full access) or 'user' (limited staff).
export type InternalRole = 'admin' | 'user';
const groupFor = (role: InternalRole) => (role === 'admin' ? 'superadmin' : 'user');

export const provisionInternalUser = (email: string, tempPassword: string, role: InternalRole) =>
  provisionUser(email, tempPassword, groupFor(role));

export interface ManagedUser {
  email: string;
  role: InternalRole;
  status?: string;
  enabled?: boolean;
  created?: string;
}

async function listGroup(group: string): Promise<Omit<ManagedUser, 'role'>[]> {
  const out = await cip.send(new ListUsersInGroupCommand({ UserPoolId: pool, GroupName: group }));
  return (out.Users || []).map((u) => ({
    email: u.Attributes?.find((a) => a.Name === 'email')?.Value || u.Username || '',
    status: u.UserStatus,
    enabled: u.Enabled,
    created: u.UserCreateDate ? new Date(u.UserCreateDate).toISOString() : undefined,
  }));
}

// Internal users only (admins + staff). Clients are excluded — they're managed
// in the Clients tab / their own portal. Admin wins if a user is in both groups.
export async function listInternalUsers(): Promise<ManagedUser[]> {
  const [admins, staff] = await Promise.all([listGroup('superadmin'), listGroup('user')]);
  const byEmail = new Map<string, ManagedUser>();
  for (const s of staff) byEmail.set(s.email.toLowerCase(), { ...s, role: 'user' });
  for (const a of admins) byEmail.set(a.email.toLowerCase(), { ...a, role: 'admin' });
  return [...byEmail.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function deleteUser(email: string): Promise<void> {
  try {
    await cip.send(new AdminDeleteUserCommand({ UserPoolId: pool, Username: email }));
  } catch (e: any) {
    if (e?.name !== 'UserNotFoundException') throw e;
  }
}
