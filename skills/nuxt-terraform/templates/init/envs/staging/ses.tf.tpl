resource "aws_ses_domain_identity" "domain" {
  domain = var.DOMAIN_ONLY
}

locals {
  ses_identity_arn = "arn:aws:ses:${var.AWS_REGION}:${var.AWS_ACCOUNT_ID}:identity/${aws_ses_domain_identity.domain.domain}"
}

output "ses_identity_arn" {
  value = local.ses_identity_arn
}
