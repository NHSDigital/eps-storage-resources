import {
  App,
  CfnOutput,
  Stack,
  StackProps
} from "aws-cdk-lib"

import {nagSuppressions} from "../nagSuppressions"
import {Dynamodb} from "../resources/Dynamodb"

export interface StorageResourcesStackProps extends StackProps{
  readonly stackName: string
  readonly version: string
}

/**
 * EPS Storage Resources
 */

export class StorageResourcesStack extends Stack {
  public constructor(scope: App, id: string, props: StorageResourcesStackProps){
    super(scope, id, props)

    // Context
    /* context values passed as --context cli arguments are passed as strings so coerce them to expected types*/
    const allowAutoDeleteObjects: boolean = this.node.tryGetContext("allowAutoDeleteObjects")

    // Imports

    // Resources
    const dynamodb = new Dynamodb(this, "DynamoDB", {
      stackName: props.stackName,
      account: this.account,
      region: this.region,
      allowAutoDeleteObjects: allowAutoDeleteObjects
    })

    //Outputs

    //Exports
    new CfnOutput(this, "tableWriteManagedPolicyArn", {
      value: dynamodb.tableWriteManagedPolicy.managedPolicyArn,
      exportName: `${props.stackName}:tableWriteManagedPolicy:Arn`
    })
    new CfnOutput(this, "tableReadManagedPolicyArn", {
      value: dynamodb.tableReadManagedPolicy.managedPolicyArn,
      exportName: `${props.stackName}:tableReadManagedPolicy:Arn`
    })
    new CfnOutput(this, "usePrescriptionsTableKmsKeyPolicyArn", {
      value: dynamodb.usePrescriptionsTableKmsKeyPolicy.managedPolicyArn,
      exportName: `${props.stackName}:usePrescriptionsTableKmsKeyPolicy:Arn`
    })
    new CfnOutput(this, "DatastoreTableArn", {
      value: dynamodb.DatastoreTable.tableArn,
      exportName: `${props.stackName}:DatastoreTable:Arn`
    })
    new CfnOutput(this, "DatastoreKmsKeyArn", {
      value: dynamodb.DatastoreKmsKey.keyArn,
      exportName: `${props.stackName}:DatastoreKmsKey:Arn`
    })
    nagSuppressions(this)
  }
}
