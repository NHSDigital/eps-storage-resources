variable "s3_bucket" {
  type        = string
  description = "S3 Bucket to create for future terraform remote state"
}

variable "ddb_table" {
  type        = string
  description = "DynamoDB table to create for future terraform lock table"
}

variable "allowed_account_ids" {
  type = list(string)
}
