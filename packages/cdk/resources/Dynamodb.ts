import {Construct} from "constructs"

import {
  Billing,
  ProjectionType,
  TableEncryptionV2,
  TableV2
} from "aws-cdk-lib/aws-dynamodb"
import {
  AccountPrincipal,
  AnyPrincipal,
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role
} from "aws-cdk-lib/aws-iam"
import {Key} from "aws-cdk-lib/aws-kms"
import {Duration, RemovalPolicy} from "aws-cdk-lib"
import {ATTRIBUTE_KEYS, AttributeNames} from "./attributes"

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
  public readonly tableResourceStatement: PolicyStatement
  public readonly DatastoreKmsKey: Key
  public readonly DatastoreTableRole: Role

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
      partitionKey: ATTRIBUTE_KEYS.PRIMARY_KEY,
      sortKey: ATTRIBUTE_KEYS.SORT_KEY,
      tableName: `${props.stackName}-datastore`,
      removalPolicy: props.allowAutoDeleteObjects ? RemovalPolicy.DESTROY: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: TableEncryptionV2.customerManagedKey(DatastoreKmsKey),
      billing: Billing.onDemand(),
      timeToLiveAttribute: AttributeNames.EXPIRE_AT
    })

    const tableResourceStatement = new PolicyStatement({
      effect: Effect.DENY,
      actions: ["*"],
      resources: [
        DatastoreTable.tableArn,
        `${DatastoreTable.tableArn}/index/*`
      ]
    })
    tableResourceStatement.addAnyPrincipal()

    DatastoreTable.addToResourcePolicy(tableResourceStatement)

    // global secondary indexes
    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nhsNumberDate",
      partitionKey: ATTRIBUTE_KEYS.NHS_NUMBER,
      sortKey: ATTRIBUTE_KEYS.CREATION_DATETIME,
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        AttributeNames.INDEXES,
        AttributeNames.PRESCRIBER_ORG,
        AttributeNames.DISPENSER_ORG
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "prescriberDate",
      partitionKey: ATTRIBUTE_KEYS.PRESCRIBER_ORG,
      sortKey: ATTRIBUTE_KEYS.CREATION_DATETIME,
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        AttributeNames.INDEXES,
        AttributeNames.DISPENSER_ORG
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "dispenserDate",
      partitionKey: ATTRIBUTE_KEYS.DISPENSER_ORG,
      sortKey: ATTRIBUTE_KEYS.CREATION_DATETIME,
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        AttributeNames.INDEXES
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nominatedPharmacyStatus",
      partitionKey: ATTRIBUTE_KEYS.NOMINATED_PHARMACY,
      sortKey: ATTRIBUTE_KEYS.IS_READY,
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        AttributeNames.STATUS,
        AttributeNames.INDEXES
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimId",
      partitionKey: ATTRIBUTE_KEYS.SORT_KEY,
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        AttributeNames.CLAIM_IDS
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nextActivityDate",
      partitionKey: ATTRIBUTE_KEYS.NEXT_ACTIVITY,
      sortKey: ATTRIBUTE_KEYS.NEXT_ACTIVITY_DATE,
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "storeTimeDocRefTitle",
      partitionKey: ATTRIBUTE_KEYS.DOC_REF_TITLE,
      sortKey: ATTRIBUTE_KEYS.STORE_TIME,
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "backstopDeleteDate",
      partitionKey: ATTRIBUTE_KEYS.SORT_KEY,
      sortKey: ATTRIBUTE_KEYS.BACKSTOP_DELETE_DATE,
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "prescriptionId",
      partitionKey: ATTRIBUTE_KEYS.PRESCRIPTION_ID,
      sortKey: ATTRIBUTE_KEYS.SORT_KEY,
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimIdSequenceNumber",
      partitionKey: ATTRIBUTE_KEYS.SEQUENCE_NUMBER,
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimIdSequenceNumberNwssp",
      partitionKey: ATTRIBUTE_KEYS.SEQUENCE_NUMBER_NWSSP,
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

    const DatastoreTableRole = new Role(this, "DatastoreTableRole", {
      assumedBy: new AccountPrincipal(props.account)
    })
    DatastoreTableRole.addManagedPolicy(tableReadManagedPolicy)
    DatastoreTableRole.addManagedPolicy(tableWriteManagedPolicy)
    DatastoreTableRole.addManagedPolicy(usePrescriptionsTableKmsKeyPolicy)

    // Outputs
    this.DatastoreTable = DatastoreTable
    this.DatastoreKmsKey = DatastoreKmsKey
    this.DatastoreTableRole = DatastoreTableRole
    this.usePrescriptionsTableKmsKeyPolicy = usePrescriptionsTableKmsKeyPolicy
    this.tableWriteManagedPolicy = tableWriteManagedPolicy
    this.tableReadManagedPolicy = tableReadManagedPolicy
    this.tableResourceStatement = tableResourceStatement
  }
}
