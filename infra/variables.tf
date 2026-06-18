variable "region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "payment-insight"
}

variable "db_name" {
  type    = string
  default = "payment_insight"
}

variable "db_username" {
  type    = string
  default = "pi_admin"
}

# Stripe TEST keys only (no live charges). Override via TF_VAR_stripe_* or terraform.tfvars.
variable "stripe_secret_key" {
  type      = string
  default   = "sk_test_placeholder"
  sensitive = true
}

variable "stripe_publishable_key" {
  type    = string
  default = "pk_test_placeholder"
}

variable "stripe_webhook_secret" {
  type      = string
  default   = "whsec_test_placeholder"
  sensitive = true
}
