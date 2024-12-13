SHELL:=/usr/bin/env bash -O globstar
.SHELLFLAGS = -ec
.PHONY: terraform-clean terraform-init terraform-plan terraform-apply
env ?= ptl

terraform-clean:
	rm -f .terraform/environment
	rm -rf terraform.tfstate.d

terraform-init: terraform-clean
	mkdir -p terraform.tfstate.d/${env}/
	aws s3 cp s3://$(shell cat env/${env}.tfvars.json | jq -r .s3_bucket)/account-bootstrap/terraform.tfstate terraform.tfstate.d/${env}/terraform.tfstate || true
	terraform init -upgrade
	terraform workspace new ${env} || terraform workspace select ${env}

terraform-plan:
	terraform plan -var-file="env/$(shell terraform workspace show).tfvars.json" ${terraform_extra_args}

terraform-apply:
	terraform apply -var-file="env/$(shell terraform workspace show).tfvars.json" ${terraform_extra_args}
	aws s3 cp terraform.tfstate.d/$(shell terraform workspace show)/terraform.tfstate s3://$(shell cat env/$(shell terraform workspace show).tfvars.json | jq -r .s3_bucket)/account-bootstrap/terraform.tfstate
