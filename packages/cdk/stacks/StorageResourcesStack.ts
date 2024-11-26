import {
  App,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {
  AttributeType,
  Billing,
  ProjectionType,
  TableEncryptionV2,
  TableV2
} from "aws-cdk-lib/aws-dynamodb"
import {
  AnyPrincipal,
  Effect,
  ManagedPolicy,
  PolicyStatement
} from "aws-cdk-lib/aws-iam"
import {Key} from "aws-cdk-lib/aws-kms"

import {nagSuppressions} from "../nagSuppressions"

export interface StorageResourcesStackProps extends StackProps{
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

    // kms key for the table
    const DatastoreKmsKey = new Key(this, "DatastoreKmsKey", {
      removalPolicy: RemovalPolicy.DESTROY,
      pendingWindow: Duration.days(7),
      alias: `alias/${props.stackName}-DatastoreKmsKey`,
      description: `${props.stackName}-DatastoreKmsKey`,
      enableKeyRotation: true
    })

    DatastoreKmsKey.addToResourcePolicy(new PolicyStatement({
      sid: "Enable IAM veit Permissions",
      effect: Effect.ALLOW,
      actions: [
        "kms:DescribeKey",
        "kms:Decrypt"
      ],
      principals: [
        new AnyPrincipal()
      ],
      resources: ["*"],
      conditions: {
        ArnLike: {
          "aws:PrincipalArn": `arn:aws:iam::${this.account}:assumed-role/veit_role/*`
        }
      }
    }))

    // the table
    const DatastoreTable = new TableV2(this, "DatastoreTable", {
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING
      },
      tableName: `${props.stackName}-datastore`,
      removalPolicy: allowAutoDeleteObjects ? RemovalPolicy.DESTROY: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: TableEncryptionV2.customerManagedKey(DatastoreKmsKey),
      billing: Billing.onDemand(),
      timeToLiveAttribute: "expireAt"
    })

    // global secondary indexes
    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nhsNumberDate",
      partitionKey: {
        name: "nhsNumber",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "creationDatetime",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        "indexes",
        "prescriberOrg",
        "dispenserOrg"
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "prescriberDate",
      partitionKey: {
        name: "prescriberOrg",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "creationDatetime",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        "indexes",
        "dispenserOrg"
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "dispenserDate",
      partitionKey: {
        name: "dispenserOrg",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "creationDatetime",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        "indexes"
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nominatedPharmacyStatus",
      partitionKey: {
        name: "nominatedPharmacy",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "status",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        "indexes"
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimId",
      partitionKey: {
        name: "sk",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        "claimIds"
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nextActivityDate",
      partitionKey: {
        name: "nextActivity",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "nextActivityDate",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "storeTimeDocRefTitle",
      partitionKey: {
        name: "docRefTitle",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "storeTime",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "backstopDeleteDate",
      partitionKey: {
        name: "sk",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "backstopDeleteDate",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "prescriptionId",
      partitionKey: {
        name: "prescriptionId",
        type: AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimIdSequenceNumber",
      partitionKey: {
        name: "sequenceNumber",
        type: AttributeType.NUMBER
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimIdSequenceNumberNwssp",
      partitionKey: {
        name: "sequenceNumberNwssp",
        type: AttributeType.NUMBER
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    // policy to use kms key
    const usePrescriptionsTableKmsKeyPolicy = new ManagedPolicy(this, "UsePrescriptionsTableKMSKeyPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "kms:DescribeKey",
            "kms:GenerateDataKey",
            "kms:Encrypt",
            "kms:ReEncryptFrom",
            "kms:ReEncryptTo",
            "kms:Decrypt"
          ],
          resources: [
            DatastoreKmsKey.keyArn
          ]
        })
      ]
    })

    // read table policy
    const tableReadManagedPolicy = new ManagedPolicy(this, "TableReadManagedPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "dynamodb:GetItem",
            "dynamodb:BatchGetItem",
            "dynamodb:Scan",
            "dynamodb:Query",
            "dynamodb:ConditionCheckItem",
            "dynamodb:DescribeTable"
          ],
          resources: [
            DatastoreTable.tableArn,
            `${DatastoreTable.tableArn}/index/*`
          ]
        })
      ]
    })

    // write table policy
    const tableWriteManagedPolicy = new ManagedPolicy(this, "TableWriteManagedPolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "dynamodb:PutItem",
            "dynamodb:BatchWriteItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem"
          ],
          resources: [
            DatastoreTable.tableArn,
            `${DatastoreTable.tableArn}/index/*`
          ]
        })
      ]
    })

    //Outputs

    //Exports
    new CfnOutput(this, "tableWriteManagedPolicyArn", {
      value: tableWriteManagedPolicy.managedPolicyArn,
      exportName: `${props.stackName}:tableWriteManagedPolicy:Arn`
    })
    new CfnOutput(this, "tableReadManagedPolicyArn", {
      value: tableReadManagedPolicy.managedPolicyArn,
      exportName: `${props.stackName}:tableReadManagedPolicy:Arn`
    })
    new CfnOutput(this, "usePrescriptionsTableKmsKeyPolicyArn", {
      value: usePrescriptionsTableKmsKeyPolicy.managedPolicyArn,
      exportName: `${props.stackName}:usePrescriptionsTableKmsKeyPolicy:Arn`
    })
    new CfnOutput(this, "DatastoreTableArn", {
      value: DatastoreTable.tableArn,
      exportName: `${props.stackName}:DatastoreTable:Arn`
    })
    new CfnOutput(this, "DatastoreKmsKeyArn", {
      value: DatastoreKmsKey.keyArn,
      exportName: `${props.stackName}:DatastoreKmsKey:Arn`
    })
    nagSuppressions(this)
  }
}
