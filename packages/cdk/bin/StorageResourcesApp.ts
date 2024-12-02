import {App, Aspects, Tags} from "aws-cdk-lib"
import {AwsSolutionsChecks} from "cdk-nag"

import {StorageResourcesStack} from "../stacks/StorageResourcesStack"

const app = new App()
/* Required Context:
  - logRetentionInDays
*/

const serviceName = app.node.tryGetContext("serviceName")
const environment = app.node.tryGetContext("environment")
const stackPrefix = `nhse-${environment}-${serviceName}`

const version = app.node.tryGetContext("VERSION_NUMBER")
const commit = app.node.tryGetContext("COMMIT_ID")

// add cdk-nag to everything
Aspects.of(app).add(new AwsSolutionsChecks({verbose: true}))

Tags.of(app).add("version", version)
Tags.of(app).add("commit", commit)
Tags.of(app).add("cdkApp", "StorageResourcesApp")

new StorageResourcesStack(app, {
  env: {
    region: "eu-west-2"
  },
  stackPrefix: stackPrefix,
  version: version
})
