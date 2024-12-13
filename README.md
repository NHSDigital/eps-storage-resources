# EPS Datastore

[Build](https://github.com/NHSDigital/eps-storage-resources/actions/workflows/ci.yml/badge.svg?branch=main)  
[Release](https://github.com/NHSDigital/eps-storage-resources/actions/workflows/release.yml/badge.svg?branch=main)

## Versions and deployments

Version release history can be found ot https://github.com/NHSDigital/eps-storage-resources/releases.  
Deployment history can be found at https://nhsdigital.github.io/eps-storage-resources/

## Introduction

This defines the storage infrastructure for EPS. It uses dynamodb (in place of Riak) as the datastore for the Spine EPS interaction.

- `scripts/` Utilities helpful to developers.
- `.devcontainer` Contains a dockerfile and vscode devcontainer definition.
- `.github` Contains github workflows that are used for building and deploying from pull requests and releases.
- `.vscode` Contains vscode workspace file.

## Contributing
Contributions to this project are welcome from anyone. Please refer to the [guidelines for contribution](./CONTRIBUTING.md) and the [community code of conduct](./CODE_OF_CONDUCT.md).

### Licensing

This code is dual licensed under the MIT license and the OGL (Open Government License). Any new work added to this repository must conform to the conditions of these licenses. In particular this means that this project may not depend on GPL-licensed or AGPL-licensed libraries, as these would violate the terms of those libraries' licenses.

The contents of this repository are protected by Crown Copyright (C).

## Development

It is recommended that you use Visual Studio Code in a Linux environment with a dev container, as this will install all necessary components and correct versions of tools and languages.  

### WSL

If you are using a Windows machine, you will need to install WSL v2+ as detailed [here](https://docs.microsoft.com/en-us/windows/wsl/install).

### Docker

You will need Docker. This is straightforward enough in a Linux environment, but if you are using WSL then you'll need to install Docker Desktop for Windows as detailed [here](https://docs.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers#install-docker-desktop) and then do the following:
- Go to Docker Desktop
- Click the _Settings_ cog icon at the top
- Click _Resources_, then _WSL integration_
- Enable WSL integration for your WSL distribution by enabling the slider

Restart your machine and run `sudo docker ps` command in WSL to check that the setup is complete.

You will need to install the Dev Containers extension for VS Code. The extension will then prompt you to _Reopen in Container_. Do this.

### Commit signing

All commits must be made using [signed commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits).

Once the steps at the link above have been completed. Add to your ~/.gnupg/gpg.conf as below:

```
use-agent
pinentry-mode loopback
```

and to your ~/.gnupg/gpg-agent.conf as below:

```
allow-loopback-pinentry
```
As described [here](https://stackoverflow.com/a/59170001)

You will need to create the files, if they do not already exist.
This will ensure that your VSCode bash terminal prompts you for your GPG key password.

You can cache the gpg key passphrase by following instructions at https://superuser.com/questions/624343/keep-gnupg-credentials-cached-for-entire-user-session

### AWS

It is intended that the DynamoDB table (and any other resources) created via the workflows defined in this repository are interacted with via the Spine codebase. There is a long-running feature branch in the Spine repo (`feature/eps-dynamodb-poc`) to hold our code changes. Follow the steps defined below on your Spine VM to allow connection to the DynamoDB table:

#### Bootstrapping

A new AWS account will need to be created and bootstrapped. This is a manual process and will need to be done by a member of the team with the necessary permissions. The process is as follows:

1. From the project root, run `make aws-configure` to configure the AWS CLI. Note the profile name created here. You'll need it later. (Make sure to set region as `eu-west-2`)
2. From the project root, run `make aws-login` to log into the AWS account.
3. Navigate to `packages/terraform/account-bootstrap`.
4. Run `env=<env> profile=<profile>  make tf-init` where `<env>` is the environment you are bootstrapping (e.g. `dev`, `qa`, `prod`) and `<profile>` is the profile name you noted earlier.
5. Run `profile=<profile> make tf-plan`. Verify that the plan looks correct.
6. Run `profile=<profile> make tf-apply` to apply the plan. This will create the necessary resources in the AWS account.

### Pre-commit hooks

Some pre-commit hooks are installed as part of the install above, to run basic lint checks and ensure you can't accidentally commit invalid changes.
The pre-commit hook uses python package pre-commit and is configured in the file .pre-commit-config.yaml.
A combination of these checks are also run in CI.

### Make commands

There are `make` commands that are run as part of the CI pipeline and help alias some functionality during development.

#### Install targets

- `install-python` Installs python dependencies.
- `install-hooks` Installs git pre-commit hooks.
- `install` Runs all install targets.

#### Clean and deep-clean targets

- `clean` Clears up any files that have been generated by building or testing locally.
- `deep-clean` Runs clean target and removes any python libraries installed locally.

#### Linting and testing

- `lint` Runs lint for all code.
- `lint-github-actions` Runs lint for github actions workflows.
- `lint-github-action-scripts` Runs shellcheck for github actions scripts.
- `lint-python` Runs lint for python code.
- `test` Runs unit tests for all code.

#### Check licenses

- `check-licenses` Checks licenses for all python code.

#### AWS targets

These will need to be run to perform account bootstrap.

- `aws-configure` Configures AWS CLI.
- `aws-login` Logs into AWS using the AWS CLI.

#### Terraform targets

- `tf-fmt` Formats terraform code.
- `tf-fmt-check` Checks terraform code formatting.
- `tf-lint` Lints terraform code.
- `tf-scan` Performs static analysis on terraform code.
- `tf-quality-checks` Runs `tf-fmt-check`, `tf-lint` and `tf-scan` targets for use in pre-commit hooks and CI.

Each terraform package (`/packages/terraform/*`) has its own `make` commands for running terraform commands.

- `tf-clean` Cleans up any files that have been generated by running terraform commands.
- `tf-init` Initialises terraform and copies local state to remote.
- `tf-plan` Creates an execution plan.
- `tf-apply` Applies the changes required to reach the desired state of the configuration.

These should only be used manually for account bootstrap.

### Github folder

This .github folder contains workflows and templates related to GitHub, along with actions and scripts pertaining to Jira.

- `pull_request_template.md` Template for pull requests.
- `dependabot.yml` Dependabot definition file.

Scripts are in the `.github/scripts` folder:

- `call_mark_jira_released.sh` Calls a Lambda function to mark Jira issues as released.
- `create_env_release_notes.sh` Generates release notes for a specific environment using a Lambda function.
- `create_int_rc_release_notes.sh` Creates release notes for integration environment using a Lambda function.
- `get_current_dev_tag.sh` Retrieves the current development tag and sets it as an environment variable.
- `get_target_deployed_tag.sh` Retrieves the currently deployed tag and sets it as an environment variable.

Workflows are in the `.github/workflows` folder:

- `ci.yml` Workflow run when code merged to main. Deploys to dev and qa environments.
- `combine_dependabot_prs.yml` Workflow for combining dependabot pull requests. Runs on demand.
- `create_release_notes.yml` Workflow for creating release notes on confluence
- `dependabot_auto_approve_and_merge.yml` Workflow to auto merge dependabot updates.
- `pr_title_check.yaml` Checks title of pull request is valid.
- `pull_request.yml` Called when pull request is opened or updated. Calls package_code and release_code to build and deploy the code. Deploys to dev AWS account. The main stack deployed adopts the naming convention storage-resources-pr-<PULL_REQUEST_ID>
- `release.yml` Runs on demand to create a release and deploy to all environments.
