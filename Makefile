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

compile-node:
	npx tsc --build tsconfig.build.json

compile: compile-node

lint-node: compile-node
	npm run lint --workspace packages/cdk

lint-githubactions:
	actionlint

lint-githubaction-scripts:
	shellcheck .github/scripts/*.sh

lint: lint-node lint-githubactions lint-githubaction-scripts

test: compile
	npm run test --workspace packages/cdk

clean:
	rm -rf packages/cdk/coverage
	rm -rf packages/cdk/lib
	rm -rf cdk.out

deep-clean: clean
	rm -rf .venv
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

check-licenses: check-licenses-node check-licenses-python

check-licenses-node:
	npm run check-licenses
	npm run check-licenses --workspace packages/cdk

check-licenses-python:
	scripts/check_python_licenses.sh

aws-configure:
	aws configure sso --region eu-west-2

aws-login:
	aws sso login --sso-session sso-session

cfn-guard:
	./scripts/run_cfn_guard.sh

cdk-synth:
	npx cdk synth \
		--quiet \
		--app "npx ts-node --prefer-ts-exts packages/cdk/bin/StorageResourcesApp.ts" \
		--context VERSION_NUMBER=undefined \
		--context COMMIT_ID=undefined 

cdk-diff: guard-service_name guard-environment
	npx cdk diff \
		--app "npx ts-node --prefer-ts-exts packages/cdk/bin/StorageResourcesApp.ts" \
		--context serviceName=$$service_name \
		--context environment=$$ENVIRONMENT \
		--context VERSION_NUMBER=$$VERSION_NUMBER \
		--context COMMIT_ID=$$COMMIT_ID 

cdk-watch: guard-service_name guard-environment
	REQUIRE_APPROVAL="$${REQUIRE_APPROVAL:-any-change}" && \
	VERSION_NUMBER="$${VERSION_NUMBER:-undefined}" && \
	COMMIT_ID="$${COMMIT_ID:-undefined}" && \
		npx cdk deploy \
		--app "npx ts-node --prefer-ts-exts packages/cdk/bin/StorageResourcesApp.ts" \
		--watch \
		--all \
		--ci true \
		--require-approval $${REQUIRE_APPROVAL} \
		--context serviceName=$$service_name \
		--context environment=$$ENVIRONMENT \
		--context VERSION_NUMBER=$$VERSION_NUMBER \
		--context COMMIT_ID=$$COMMIT_ID
