terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">=1.10.2"
}

provider "aws" {
  region              = "eu-west-2"
  allowed_account_ids = var.allowed_account_ids

  default_tags {
    tags = local.tags
  }
}
