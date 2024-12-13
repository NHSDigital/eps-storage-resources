resource "aws_dynamodb_table" "main" {
  name         = var.ddb_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.terraform.arn
  }

  tags = {
    Name = var.ddb_table
  }
}
