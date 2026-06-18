resource "random_password" "db" {
  length  = 24
  special = false # keep URL/CLI friendly
}

# One secret holds everything the API needs at runtime.
resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.project}/app"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DB_HOST                = aws_db_instance.main.address
    DB_PORT                = 5432
    DB_NAME                = var.db_name
    DB_USER                = var.db_username
    DB_PASSWORD            = random_password.db.result
    STRIPE_SECRET_KEY      = var.stripe_secret_key
    STRIPE_PUBLISHABLE_KEY = var.stripe_publishable_key
    STRIPE_WEBHOOK_SECRET  = var.stripe_webhook_secret
    STRIPE_MODE            = "test"
  })
}
