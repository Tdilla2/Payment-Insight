# Remote state: state lives in S3 (versioned + encrypted), locked via DynamoDB.
# The bucket and lock table are created out-of-band (see README) since they must
# exist before they can hold state.
terraform {
  backend "s3" {
    bucket         = "payment-insight-tfstate-130423149110"
    key            = "payment-insight/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "payment-insight-tf-lock"
    encrypt        = true
  }
}
