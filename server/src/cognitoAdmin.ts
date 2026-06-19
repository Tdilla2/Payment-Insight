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
    await cip.send(new AdminSetUserPasswordCommand({
      UserPoolId: pool, Username: email, Password: tempPassword, Permanent: false,
    }));
    await cip.send(new AdminAddUserToGroupCommand({
      UserPoolId: pool, Username: email, GroupName: group,
    }));
  } catch (e: any) {
    if (e?.name !== 'UsernameExistsException') throw e;
  }
}

export const provisionClientUser = (email: string, tempPassword: string) =>
  provisionUser(email, tempPassword, 'client');

export const provisionAdminUser = (email: string, tempPassword: string) =>
  provisionUser(email, tempPassword, 'superadmin');

export interface ManagedUser {
  email: string;
  role: 'admin' | 'client';
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

// All users across both roles. If a user is somehow in both groups, admin wins.
export async function listAllUsers(): Promise<ManagedUser[]> {
  const [admins, clients] = await Promise.all([listGroup('superadmin'), listGroup('client')]);
  const byEmail = new Map<string, ManagedUser>();
  for (const c of clients) byEmail.set(c.email.toLowerCase(), { ...c, role: 'client' });
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
