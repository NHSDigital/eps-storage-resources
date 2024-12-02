import {
  App,
  CfnOutput,
  Stack,
  StackProps
} from "aws-cdk-lib"

import {nagSuppressions} from "../nagSuppressions"
import {Dynamodb} from "../resources/Dynamodb"

export interface StorageResourcesStackProps extends StackProps{
  readonly stackPrefix: string
  readonly version: string
}

/**
 * EPS Storage Resources
 */

export class StorageResourcesStack extends Stack {
  public constructor(scope: App, props: StorageResourcesStackProps){
    super(scope, props.stackPrefix, props)

    // Context
    /* context values passed as --context cli arguments are passed as strings so coerce them to expected types*/
    const allowAutoDeleteObjects: boolean = this.node.tryGetContext("allowAutoDeleteObjects")

    // Imports

    // Resources
    const dynamodb = new Dynamodb(this, "DynamoDB", {
      stackPrefix: props.stackPrefix,
      account: this.account,
      region: this.region,
      allowAutoDeleteObjects: allowAutoDeleteObjects
    })

    //Outputs

    //Exports
    new CfnOutput(this, "tableWriteManagedPolicyArn", {
      value: dynamodb.tableWriteManagedPolicy.managedPolicyArn,
      exportName: `${props.stackPrefix}:tableWriteManagedPolicy:Arn`
    })
    new CfnOutput(this, "tableReadManagedPolicyArn", {
      value: dynamodb.tableReadManagedPolicy.managedPolicyArn,
      exportName: `${props.stackPrefix}:tableReadManagedPolicy:Arn`
    })
    new CfnOutput(this, "usePrescriptionsTableKmsKeyPolicyArn", {
      value: dynamodb.usePrescriptionsTableKmsKeyPolicy.managedPolicyArn,
      exportName: `${props.stackPrefix}:usePrescriptionsTableKmsKeyPolicy:Arn`
    })
    new CfnOutput(this, "DatastoreTableArn", {
      value: dynamodb.DatastoreTable.tableArn,
      exportName: `${props.stackPrefix}:DatastoreTable:Arn`
    })
    new CfnOutput(this, "DatastoreKmsKeyArn", {
      value: dynamodb.DatastoreKmsKey.keyArn,
      exportName: `${props.stackPrefix}:DatastoreKmsKey:Arn`
    })
    nagSuppressions(this)
  }
}
