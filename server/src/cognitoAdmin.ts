import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const region = process.env.AWS_REGION_NAME || process.env.AWS_REGION || 'us-east-1';
const pool = process.env.COGNITO_USER_POOL_ID!;
const cip = new CognitoIdentityProviderClient({ region });

// Create a client login with a temporary password (forces change on first sign-in).
export async function provisionClientUser(email: string, tempPassword: string): Promise<void> {
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
    // Temporary (non-permanent) password => NEW_PASSWORD_REQUIRED challenge at first login.
    await cip.send(new AdminSetUserPasswordCommand({
      UserPoolId: pool, Username: email, Password: tempPassword, Permanent: false,
    }));
    await cip.send(new AdminAddUserToGroupCommand({
      UserPoolId: pool, Username: email, GroupName: 'client',
    }));
  } catch (e: any) {
    if (e?.name !== 'UsernameExistsException') throw e;
  }
}

export async function deleteUser(email: string): Promise<void> {
  try {
    await cip.send(new AdminDeleteUserCommand({ UserPoolId: pool, Username: email }));
  } catch (e: any) {
    if (e?.name !== 'UserNotFoundException') throw e;
  }
}
