# Payment Insight — Infrastructure (OpenTofu)

All AWS infrastructure for Payment Insight: RDS PostgreSQL, Cognito, Lambda +
API Gateway, S3 + CloudFront, Secrets Manager.

## Remote state

State is stored remotely so the whole team shares one source of truth:

- **State:** `s3://payment-insight-tfstate-130423149110/payment-insight/terraform.tfstate` (versioned + encrypted)
- **Locking:** DynamoDB table `payment-insight-tf-lock`

These two resources are created **out-of-band** (they must exist before they can
hold state). To recreate them in a fresh account:

```sh
ACCT=$(aws sts get-caller-identity --query Account --output text)
aws s3api create-bucket --bucket payment-insight-tfstate-$ACCT --region us-east-1
aws s3api put-bucket-versioning --bucket payment-insight-tfstate-$ACCT \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket payment-insight-tfstate-$ACCT \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws dynamodb create-table --table-name payment-insight-tf-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1
```

Then update the bucket name in `backend.tf` and run `tofu init`.

## Usage

```sh
tofu init      # first time / after backend or provider changes
tofu plan
tofu apply
```

Stripe keys are passed as variables (test mode by default):

```sh
export TF_VAR_stripe_secret_key=sk_test_...
export TF_VAR_stripe_publishable_key=pk_test_...
tofu apply
```

## Teardown

`tofu destroy` removes all managed resources. The state bucket and lock table
are not managed by this config, so delete them manually if desired.
