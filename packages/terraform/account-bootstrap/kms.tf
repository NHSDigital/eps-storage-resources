resource "aws_kms_key" "terraform" {
  description             = "${local.environment} Terraform"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_key_policy" "terraform" {
  key_id = aws_kms_key.terraform.id
  policy = jsonencode({
    Id = "terraform"
    Statement = [
      {
        "Sid" : "Enable IAM User Permissions",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "arn:aws:iam::${local.aws_account_id}:root"
        },
        "Action" : "kms:*",
        "Resource" : "*"
      }
    ]
    Version = "2012-10-17"
  })
}

resource "aws_kms_alias" "terraform" {
  name          = "alias/${local.environment}-terraform"
  target_key_id = aws_kms_key.terraform.id
}
