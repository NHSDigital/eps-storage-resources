import {Construct} from "constructs"

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
import {Duration, RemovalPolicy} from "aws-cdk-lib"

export interface DynamodbProps {
  readonly stackName: string
  readonly account: string
  readonly region: string
  readonly allowAutoDeleteObjects: boolean
}

/**
 * Dynamodb table used for user prescriptions
 */

export class Dynamodb extends Construct {
  public readonly DatastoreTable: TableV2
  public readonly usePrescriptionsTableKmsKeyPolicy: ManagedPolicy
  public readonly tableWriteManagedPolicy: ManagedPolicy
  public readonly tableReadManagedPolicy: ManagedPolicy
  public readonly DatastoreKmsKey: Key

  public constructor(scope: Construct, id: string, props: DynamodbProps) {
    super(scope, id)

    // Resources
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
          "aws:PrincipalArn": `arn:aws:iam::${props.account}:assumed-role/veit_role/*`
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
      removalPolicy: props.allowAutoDeleteObjects ? RemovalPolicy.DESTROY: RemovalPolicy.RETAIN,
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
        name: "isReady",
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        "status",
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

    // Outputs
    this.DatastoreTable = DatastoreTable
    this.DatastoreKmsKey = DatastoreKmsKey
    this.usePrescriptionsTableKmsKeyPolicy = usePrescriptionsTableKmsKeyPolicy
    this.tableWriteManagedPolicy = tableWriteManagedPolicy
    this.tableReadManagedPolicy = tableReadManagedPolicy
  }
}
