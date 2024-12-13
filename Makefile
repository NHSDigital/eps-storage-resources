guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Environment variable $* not set"; \
		exit 1; \
	fi

.PHONY: install build test publish release clean

install: install-node install-python install-hooks

install-python:
	poetry install

install-node:
	npm ci

install-hooks: install-python
	poetry run pre-commit install --install-hooks --overwrite

lint-githubactions:
	actionlint

lint-githubaction-scripts:
	shellcheck .github/scripts/*.sh

lint: lint-githubactions lint-githubaction-scripts tf-lint

aws-configure:
	aws configure sso --region eu-west-2

aws-login:
	aws sso login --sso-session sso-session

tf-fmt:
	cd packages/terraform && terraform fmt -recursive

tf-fmt-check:
	cd packages/terraform && terraform fmt -check -recursive

tf-lint:
	docker run --rm -v $(shell pwd)/packages/terraform:/data -t ghcr.io/terraform-linters/tflint --recursive

tf-scan:
# Insert checkov or trivy here

tf-quality-checks: tf-fmt-check tf-lint tf-scan

test:

clean:

deep-clean: clean
	rm -rf .venv
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

check-licenses: check-licenses-node check-licenses-python

check-licenses-node:
	npm run check-licenses

check-licenses-python:
	scripts/check_python_licenses.sh
