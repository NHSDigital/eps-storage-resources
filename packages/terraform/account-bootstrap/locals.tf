locals {
  environment        = terraform.workspace
  production         = startswith(local.environment, "live")
  data_clasification = local.production ? "5" : "1"
  aws_account_id     = data.aws_caller_identity.current.account_id

  tags = {
    TagVersion         = "1"
    Programme          = "Demographics"
    Project            = "PDS"
    DataClassification = local.data_clasification
    Environment        = local.environment
    ServiceCategory    = local.production ? "Platinum" : "N/A"
    Tool               = "terraform"
    Domain             = "demographics"
    map-migrated       = "mig45780"
  }
}

data "aws_caller_identity" "current" {}
