#!/usr/bin/env bash

# generic script for removing cloudformation stacks and proxygen deployed apis where the pull request is closed

# set the repo name to be the name of the repo this is running in
REPO_NAME=eps-storage-resources

# this should be a regex used in jq command that parses the output from aws cloudformation list-stacks and just captures stacks we are interested in
CAPTURE_REGEX="^storage-resources-pr-(\\d+)-*"


# this should be customised to delete cloudformation stacks and proxygen deployments if they are used
main() {
  delete_cloudformation_stacks "eu-west-2"
  echo
  echo "***********************"
  echo
}

delete_cloudformation_stacks() {
  region=$1
  echo "checking cloudformation stacks in region $region"
  echo
  ACTIVE_STACKS=$(aws cloudformation list-stacks --region "$region" | jq -r --arg CAPTURE_REGEX "${CAPTURE_REGEX}" '.StackSummaries[] | select ( .StackStatus != "DELETE_COMPLETE" ) | select( .StackName | capture($CAPTURE_REGEX) ) | .StackName ')

  mapfile -t ACTIVE_STACKS_ARRAY <<< "$ACTIVE_STACKS"

  for i in "${ACTIVE_STACKS_ARRAY[@]}"
  do 
    echo "Checking if stack $i has open pull request"
    PULL_REQUEST=$(echo "$i" | grep -oP '\d+')
    echo "Checking pull request id ${PULL_REQUEST}"
    URL="https://api.github.com/repos/NHSDigital/${REPO_NAME}/pulls/${PULL_REQUEST}"
    RESPONSE=$(curl --url "${URL}" --header "Authorization: Bearer ${GITHUB_TOKEN}" 2>/dev/null)
    STATE=$(echo "${RESPONSE}" | jq -r .state)
    if [ "$STATE" == "closed" ]; then
      echo "** going to delete stack $i as state is ${STATE} **"
      aws cloudformation delete-stack --region "$region" --stack-name "${i}"
      echo "** Sleeping for 60 seconds to avoid 429 on delete stack **"
      sleep 60
    else
      echo "not going to delete stack $i as state is ${STATE}"
    fi
  done
}

main
