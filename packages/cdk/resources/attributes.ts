import {AttributeType} from "aws-cdk-lib/aws-dynamodb"

export enum AttributeNames {
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

  interface AttributeKey {
    name: string
    type: AttributeType
  }

const stringKey = (name: AttributeNames): AttributeKey => {
  return {
    name: name,
    type: AttributeType.STRING
  }
}

const numberKey = (name: AttributeNames): AttributeKey => {
  return {
    name: name,
    type: AttributeType.NUMBER
  }
}

export const ATTRIBUTE_KEYS = {
  PRIMARY_KEY: stringKey(AttributeNames.PRIMARY_KEY),
  NHS_NUMBER: stringKey(AttributeNames.NHS_NUMBER),
  CREATION_DATETIME: stringKey(AttributeNames.CREATION_DATETIME),
  PRESCRIBER_ORG: stringKey(AttributeNames.PRESCRIBER_ORG),
  DISPENSER_ORG: stringKey(AttributeNames.DISPENSER_ORG),
  NOMINATED_PHARMACY: stringKey(AttributeNames.NOMINATED_PHARMACY),
  IS_READY: numberKey(AttributeNames.IS_READY),
  SORT_KEY: stringKey(AttributeNames.SORT_KEY),
  NEXT_ACTIVITY: stringKey(AttributeNames.NEXT_ACTIVITY),
  NEXT_ACTIVITY_DATE: stringKey(AttributeNames.NEXT_ACTIVITY_DATE),
  DOC_REF_TITLE: stringKey(AttributeNames.DOC_REF_TITLE),
  STORE_TIME: stringKey(AttributeNames.STORE_TIME),
  BACKSTOP_DELETE_DATE: stringKey(AttributeNames.BACKSTOP_DELETE_DATE),
  PRESCRIPTION_ID: stringKey(AttributeNames.PRESCRIPTION_ID),
  SEQUENCE_NUMBER: numberKey(AttributeNames.SEQUENCE_NUMBER),
  SEQUENCE_NUMBER_NWSSP: numberKey(AttributeNames.SEQUENCE_NUMBER_NWSSP)
}
