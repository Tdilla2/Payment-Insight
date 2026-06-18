import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface AppConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_MODE: string;
}

let cached: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (cached) return cached;
  const arn = process.env.SECRET_ARN;
  if (!arn) throw new Error('SECRET_ARN not set');
  const region = process.env.AWS_REGION_NAME || process.env.AWS_REGION || 'us-east-1';
  const client = new SecretsManagerClient({ region });
  const out = await client.send(new GetSecretValueCommand({ SecretId: arn }));
  cached = JSON.parse(out.SecretString || '{}') as AppConfig;
  return cached;
}
