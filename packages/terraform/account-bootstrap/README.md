# account-bootstrap

## Description 

Creation of AWS resources to be used to manage terraform backend.

## Resources


| Main Resources    | Functionality                           |
|-------------------|-----------------------------------------|
| S3 bucket         | Store terraform state                   |
| DynamoDB table    | Manage state locking                    |
| KMS Key           | Encryption of contents in the S3 bucket |

Bucket and table are created with name `nhse-<env>-eps-terraform`
