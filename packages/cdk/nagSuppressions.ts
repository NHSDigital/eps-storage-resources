/* eslint-disable max-len */

import {Stack} from "aws-cdk-lib"
import {NagPackSuppression, NagSuppressions} from "cdk-nag"

export const nagSuppressions = (stack: Stack) => {
  safeAddNagSuppression(
    stack,
    "/StorageResourcesStack/TableReadManagedPolicy/Resource",
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Suppress error for wildcards in policy. This policy is to allow access to all indexes so needs a wildcard"
      }
    ]
  )

  safeAddNagSuppression(
    stack,
    "/StorageResourcesStack/TableWriteManagedPolicy/Resource",
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
    NagSuppressions.addResourceSuppressionsByPath(stack, path, suppressions)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch(err){
    console.log(`Could not find path ${path}`)
  }
}
