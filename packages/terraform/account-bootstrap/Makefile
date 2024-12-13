SHELL:=/usr/bin/env bash -O globstar
.SHELLFLAGS = -ec
.PHONY: tf-clean tf-init tf-plan tf-apply

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

tf-clean:
	rm -f .terraform/environment
	rm -rf terraform.tfstate.d

tf-init: tf-clean guard-env guard-profile
	mkdir -p terraform.tfstate.d/${env}/
	AWS_PROFILE=${profile} aws s3 cp s3://$(shell cat env/${env}.tfvars.json | jq -r .s3_bucket)/account-bootstrap/terraform.tfstate terraform.tfstate.d/${env}/terraform.tfstate || true
	terraform init -upgrade
	terraform workspace new ${env} || terraform workspace select ${env}

tf-plan: guard-profile
	AWS_PROFILE=${profile} terraform plan -var-file="env/$(shell terraform workspace show).tfvars.json" ${terraform_extra_args}

tf-apply: guard-profile
	AWS_PROFILE=${profile} terraform apply -var-file="env/$(shell terraform workspace show).tfvars.json" ${terraform_extra_args}
	AWS_PROFILE=${profile} aws s3 cp terraform.tfstate.d/$(shell terraform workspace show)/terraform.tfstate s3://$(shell cat env/$(shell terraform workspace show).tfvars.json | jq -r .s3_bucket)/account-bootstrap/terraform.tfstate
