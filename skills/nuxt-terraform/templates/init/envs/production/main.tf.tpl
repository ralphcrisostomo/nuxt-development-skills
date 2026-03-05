terraform {
  backend "s3" {}
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = merge(var.tags, {
      project     = var.project_name
      environment = var.environment
    })
  }
}

module "app_base" {
  source = "../../modules/app_base"

  project_name = var.project_name
  environment  = var.environment
}
