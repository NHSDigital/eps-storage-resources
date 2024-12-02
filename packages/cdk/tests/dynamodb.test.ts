import {
  expect,
  describe,
  test,
  beforeAll
} from "@jest/globals"
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import {AwsSolutionsChecks} from "cdk-nag"
import {Aspects, Stack} from "aws-cdk-lib"
import {StorageResourcesStack, StorageResourcesStackProps} from "../stacks/StorageResourcesStack"
import {PolicyStatement} from "aws-cdk-lib/aws-iam"
import {Dynamodb} from "../resources/Dynamodb"

describe("dynamodb resources are valid", () => {
  let stack: Stack
  let app: cdk.App

  beforeAll(() => {
    // GIVEN
    app = new cdk.App()

    const props: StorageResourcesStackProps = {
      stackName: "test",
      version: "test"
    }
    stack = new StorageResourcesStack(app, "test", props)

    // WHEN
    Aspects.of(stack).add(new AwsSolutionsChecks())
  })

  test("table resource policy is valid", () => {
    const dynamodb = stack.node.findChild("DynamoDB") as unknown as Dynamodb

    const statement = dynamodb.tableResourceStatement as unknown as PolicyStatement

    const errors = statement.validateForResourcePolicy()
    expect(errors).toHaveLength(0)
  })
})
