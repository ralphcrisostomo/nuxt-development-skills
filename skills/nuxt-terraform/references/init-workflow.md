# Init Workflow

Read this file when running Command 1 (Init). Contains directory structure, template placeholders, static file lists, scripts, and package.json entries.

## Directory Structure

```
<project-root>/
├── terraform-scaffold.config.ts
├── terraform/
│   ├── envs/
│   │   ├── staging/
│   │   │   ├── backend.hcl
│   │   │   ├── main.tf
│   │   │   ├── outputs.tf
│   │   │   ├── variables.tf
│   │   │   ├── versions.tf
│   │   │   ├── terraform.tfvars.example
│   │   │   ├── schema.graphql
│   │   │   ├── lambda_function.tf          ← standalone lambdas
│   │   │   └── <model>.tf                  ← per-model resolver TF blocks
│   │   └── production/
│   │       ├── backend.hcl
│   │       ├── main.tf
│   │       ├── outputs.tf
│   │       ├── variables.tf
│   │       ├── versions.tf
│   │       └── terraform.tfvars.example
│   ├── functions/
│   │   ├── base.js                         ← hash validation pipeline
│   │   ├── invoke.js                       ← Lambda invoke resolver
│   │   ├── none.js                         ← NONE datasource resolver
│   │   └── <resolverName>.js               ← per-resolver AppSync JS functions
│   ├── lambda/
│   │   ├── tsconfig.json
│   │   ├── src/<PREFIX><Name>/
│   │   │   ├── index.ts
│   │   │   ├── package.json
│   │   │   ├── AGENTS.md
│   │   │   └── GEMINI.md
│   │   └── dist/
│   └── modules/                            ← 18 Terraform modules (see terraform-modules.md)
├── services/
├── app/
│   ├── composables/
│   └── graphql/
└── utils/
    └── hash.ts
```

## Template Placeholders

All `.tpl` files use `{{PLACEHOLDER}}` syntax. Replace before writing.

| Placeholder | Value |
|---|---|
| `{{PROJECT_NAME}}` | Raw project name |
| `{{PROJECT_KEBAB}}` | Kebab-case version |
| `{{FUNCTION_PREFIX}}` | PascalCase prefix |
| `{{AWS_REGION}}` | Chosen region |
| `{{STATE_BUCKET}}` | S3 bucket name |
| `{{LOCK_TABLE}}` | DynamoDB table name |
| `{{AWS_PROFILE}}` | AWS CLI profile name |

## Template Files

### Config & Schema

| File | Target Path | Source |
|---|---|---|
| `terraform-scaffold.config.ts` | `<root>/terraform-scaffold.config.ts` | [templates/init/terraform-scaffold.config.ts.tpl](../templates/init/terraform-scaffold.config.ts.tpl) |
| `schema.graphql` | `terraform/envs/staging/schema.graphql` | [templates/init/schema.graphql.tpl](../templates/init/schema.graphql.tpl) |

### Staging Environment — `terraform/envs/staging/`

| File | Placeholders | Source |
|---|---|---|
| `backend.hcl` | `STATE_BUCKET`, `PROJECT_KEBAB`, `AWS_REGION`, `LOCK_TABLE`, `AWS_PROFILE` | [staging/backend.hcl.tpl](../templates/init/envs/staging/backend.hcl.tpl) |
| `main.tf` | None | [staging/main.tf.tpl](../templates/init/envs/staging/main.tf.tpl) |
| `outputs.tf` | None | [staging/outputs.tf.tpl](../templates/init/envs/staging/outputs.tf.tpl) |
| `variables.tf` | None | [staging/variables.tf.tpl](../templates/init/envs/staging/variables.tf.tpl) |
| `ses.tf` | None | [staging/ses.tf.tpl](../templates/init/envs/staging/ses.tf.tpl) |
| `versions.tf` | None | [staging/versions.tf.tpl](../templates/init/envs/staging/versions.tf.tpl) |
| `terraform.tfvars.example` | `FUNCTION_PREFIX`, `PROJECT_KEBAB`, `AWS_REGION` | [staging/terraform.tfvars.example.tpl](../templates/init/envs/staging/terraform.tfvars.example.tpl) |

### Production Environment — `terraform/envs/production/`

| File | Placeholders | Source |
|---|---|---|
| `backend.hcl` | `STATE_BUCKET`, `PROJECT_KEBAB`, `AWS_REGION`, `LOCK_TABLE`, `AWS_PROFILE` | [production/backend.hcl.tpl](../templates/init/envs/production/backend.hcl.tpl) |
| `main.tf` | None | [production/main.tf.tpl](../templates/init/envs/production/main.tf.tpl) |
| `outputs.tf` | None | [production/outputs.tf.tpl](../templates/init/envs/production/outputs.tf.tpl) |
| `variables.tf` | `AWS_REGION` | [production/variables.tf.tpl](../templates/init/envs/production/variables.tf.tpl) |
| `ses.tf` | None | [production/ses.tf.tpl](../templates/init/envs/production/ses.tf.tpl) |
| `versions.tf` | None | [production/versions.tf.tpl](../templates/init/envs/production/versions.tf.tpl) |
| `terraform.tfvars.example` | `PROJECT_KEBAB`, `AWS_REGION` | [production/terraform.tfvars.example.tpl](../templates/init/envs/production/terraform.tfvars.example.tpl) |

### Lambda Config

| File | Target Path | Source |
|---|---|---|
| `tsconfig.json` | `terraform/lambda/tsconfig.json` | [templates/init/lambda/tsconfig.json](../templates/init/lambda/tsconfig.json) |

## Static Files

Copy as-is from template sources. Never overwrite existing files.

### AppSync Pipeline Functions → `terraform/functions/`

| File | Description | Source |
|---|---|---|
| `base.js` | Hash validation pipeline — compares `x-hbm-hash` header against djb2 hash of args | [templates/init/functions/base.js](../templates/init/functions/base.js) |
| `invoke.js` | Lambda invoke resolver — forwards context to Lambda datasource | [templates/init/functions/invoke.js](../templates/init/functions/invoke.js) |
| `none.js` | NONE datasource resolver — returns `{ userId }` from args | [templates/init/functions/none.js](../templates/init/functions/none.js) |

### Services → `services/`

| File | Description | Source |
|---|---|---|
| `cognitoService.ts` | Cognito auth — sign in/up, confirm, forgot password, refresh tokens | [templates/init/services/cognitoService.ts](../templates/init/services/cognitoService.ts) |
| `dynamodbService.ts` | DynamoDB CRUD — get, query, put, update, delete, bulk put, scan | [templates/init/services/dynamodbService.ts](../templates/init/services/dynamodbService.ts) |
| `s3Service.ts` | S3 uploads — `putObject` and `buildS3Key` helper | [templates/init/services/s3Service.ts](../templates/init/services/s3Service.ts) |
| `sesService.ts` | SES email — MIME message builder with S3 attachment support | [templates/init/services/sesService.ts](../templates/init/services/sesService.ts) |
| `netsuiteService.ts` | NetSuite REST client — OAuth 1.0 HMAC-SHA256 signed requests | [templates/init/services/netsuiteService.ts](../templates/init/services/netsuiteService.ts) |
| `textractService.ts` | AWS Textract — document analysis (forms + tables) | [templates/init/services/textractService.ts](../templates/init/services/textractService.ts) |

### Composables → `app/composables/`

| File | Description | Source |
|---|---|---|
| `useAuthState.ts` | Reactive auth state with role-based cookies | [templates/init/composables/useAuthState.ts](../templates/init/composables/useAuthState.ts) |
| `useCognitoAuth.ts` | Full Cognito auth flow — sign in/up, confirm, token refresh | [templates/init/composables/useCognitoAuth.ts](../templates/init/composables/useCognitoAuth.ts) |
| `useGraphql.ts` | AppSync GraphQL client — SSR-safe with djb2 hash header | [templates/init/composables/useGraphql.ts](../templates/init/composables/useGraphql.ts) |

### Utilities → `utils/`

| File | Description | Source |
|---|---|---|
| `hash.ts` | djb2 hash function — truncates input to 1000 chars | [templates/init/utils/hash.ts](../templates/init/utils/hash.ts) |

## Scripts

Copy from the skill's [scripts/tf/](../scripts/tf/) directory into the target project's `scripts/tf/`:

| File | Description |
|---|---|
| `tf-run.ts` | Terraform init/plan/apply wrapper |
| `tf-output.ts` | Export terraform outputs to .env files |
| `tf-lambda-build.ts` | Bundle and zip Lambda functions with esbuild (requires `esbuild` + `archiver` devDependencies) |
| `tf-sync-modules.ts` | Sync terraform modules with drift detection |

Install script dependencies if missing:

```bash
bun add -d esbuild archiver @types/archiver
```

## package.json Scripts

```json
{
  "tf:init:staging": "bun scripts/tf/tf-run.ts staging init",
  "tf:plan:staging": "bun scripts/tf/tf-run.ts staging plan",
  "tf:apply:staging": "bun scripts/tf/tf-run.ts staging apply",
  "tf:build:staging": "bun scripts/tf/tf-lambda-build.ts --env=staging",
  "tf:output:staging": "bun scripts/tf/tf-output.ts staging",
  "tf:init:production": "bun scripts/tf/tf-run.ts production init",
  "tf:plan:production": "bun scripts/tf/tf-run.ts production plan",
  "tf:apply:production": "bun scripts/tf/tf-run.ts production apply",
  "tf:build:production": "bun scripts/tf/tf-lambda-build.ts --env=production",
  "tf:output:production": "bun scripts/tf/tf-output.ts production",
  "tf:sync-modules": "bun scripts/tf/tf-sync-modules.ts"
}
```
