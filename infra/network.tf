# Use the account's default VPC/subnets to avoid NAT-gateway cost.
# The API Lambda runs OUTSIDE the VPC (so it can reach Stripe/Cognito on the
# internet), and connects to RDS over its public endpoint with SSL — a common
# low-cost serverless pattern. RDS is locked down by security group + password.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "db" {
  name_prefix = "${var.project}-db-"
  description = "Payment Insight RDS access"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # v1: public + SSL + strong password. Tighten later.
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
}
