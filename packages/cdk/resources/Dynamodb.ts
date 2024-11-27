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

enum Attributes {
  PRIMARY_KEY = "pk",
  SORT_KEY = "sk",
  NHS_NUMBER = "nhsNumber",
  CREATION_DATETIME = "creationDatetime",
  INDEXES = "indexes",
  PRESCRIBER_ORG = "prescriberOrg",
  DISPENSER_ORG = "dispenserOrg",
  NOMINATED_PHARMACY = "nominatedPharmacy",
  IS_READY = "isReady",
  STATUS = "status",
  CLAIM_IDS = "claimIds",
  NEXT_ACTIVITY = "nextActivity",
  NEXT_ACTIVITY_DATE = "nextActivityDate",
  DOC_REF_TITLE = "docRefTitle",
  STORE_TIME = "storeTime",
  BACKSTOP_DELETE_DATE = "backstopDeleteDate",
  PRESCRIPTION_ID = "prescriptionId",
  SEQUENCE_NUMBER = "sequenceNumber",
  SEQUENCE_NUMBER_NWSSP = "sequenceNumberNwssp",
  EXPIRE_AT = "expireAt"
}

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
        name: Attributes.PRIMARY_KEY,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.SORT_KEY,
        type: AttributeType.STRING
      },
      tableName: `${props.stackName}-datastore`,
      removalPolicy: props.allowAutoDeleteObjects ? RemovalPolicy.DESTROY: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      encryption: TableEncryptionV2.customerManagedKey(DatastoreKmsKey),
      billing: Billing.onDemand(),
      timeToLiveAttribute: Attributes.EXPIRE_AT
    })

    // global secondary indexes
    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nhsNumberDate",
      partitionKey: {
        name: Attributes.NHS_NUMBER,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.CREATION_DATETIME,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        Attributes.INDEXES,
        Attributes.PRESCRIBER_ORG,
        Attributes.DISPENSER_ORG
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "prescriberDate",
      partitionKey: {
        name: Attributes.PRESCRIBER_ORG,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.CREATION_DATETIME,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        Attributes.INDEXES,
        Attributes.DISPENSER_ORG
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "dispenserDate",
      partitionKey: {
        name: Attributes.DISPENSER_ORG,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.CREATION_DATETIME,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        Attributes.INDEXES
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nominatedPharmacyStatus",
      partitionKey: {
        name: Attributes.NOMINATED_PHARMACY,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.IS_READY,
        type: AttributeType.NUMBER
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        Attributes.STATUS,
        Attributes.INDEXES
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimId",
      partitionKey: {
        name: Attributes.SORT_KEY,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: [
        Attributes.CLAIM_IDS
      ]
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "nextActivityDate",
      partitionKey: {
        name: Attributes.NEXT_ACTIVITY,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.NEXT_ACTIVITY_DATE,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "storeTimeDocRefTitle",
      partitionKey: {
        name: Attributes.DOC_REF_TITLE,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.STORE_TIME,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "backstopDeleteDate",
      partitionKey: {
        name: Attributes.SORT_KEY,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.BACKSTOP_DELETE_DATE,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "prescriptionId",
      partitionKey: {
        name: Attributes.PRESCRIPTION_ID,
        type: AttributeType.STRING
      },
      sortKey: {
        name: Attributes.SORT_KEY,
        type: AttributeType.STRING
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimIdSequenceNumber",
      partitionKey: {
        name: Attributes.SEQUENCE_NUMBER,
        type: AttributeType.NUMBER
      },
      projectionType: ProjectionType.KEYS_ONLY
    })

    DatastoreTable.addGlobalSecondaryIndex({
      indexName: "claimIdSequenceNumberNwssp",
      partitionKey: {
        name: Attributes.SEQUENCE_NUMBER_NWSSP,
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
