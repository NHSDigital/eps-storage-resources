/* eslint-disable max-len */

import {Stack} from "aws-cdk-lib"
import {NagPackSuppression, NagSuppressions} from "cdk-nag"

export const nagSuppressions = (stack: Stack) => {
  safeAddNagSuppression(
    stack,
    "/DynamoDB/TableReadManagedPolicy/Resource",
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Suppress error for wildcards in policy. This policy is to allow access to all indexes so needs a wildcard"
      }
    ]
  )

  safeAddNagSuppression(
    stack,
    "/DynamoDB/TableWriteManagedPolicy/Resource",
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Suppress error for wildcards in policy. This policy is to allow access to all indexes so needs a wildcard"
      }
    ]
  )

}

const safeAddNagSuppression = (stack: Stack, path: string, suppressions: Array<NagPackSuppression>) => {
  try {
    const stack_id = stack.node.id
    const full_path = `/${stack_id}${path}`
    NagSuppressions.addResourceSuppressionsByPath(stack, full_path, suppressions)

  } catch(err){
    console.log(`Could not find path ${path} in stack ${stack.node.id}`)
    throw err
  }
}
