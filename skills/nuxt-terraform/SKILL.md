---
name: nuxt-terraform
description: "Scaffold Nuxt + AWS Terraform infrastructure. Use when adding GraphQL resolvers, Lambda functions, or initializing a new project with AppSync, DynamoDB, Cognito. Triggers on: add graphql resolver, create lambda, scaffold terraform, init terraform, add appsync resolver, add mutation, add query."
---

# Nuxt + Terraform Scaffold Skill

Generate files for Nuxt + AWS infrastructure projects following exact conventions from the terraform-scaffold tool. This skill replaces the CLI — you generate all files directly.

---

## When to Use

- Initializing a new Nuxt + Terraform project structure
- Adding a GraphQL resolver (AppSync JS or Lambda-backed)
- Creating a standalone Lambda function (standard or cron)
- User mentions: resolver, lambda, graphql, appsync, terraform scaffold, dynamodb query

---

## Pre-Requisites

Before scaffolding, check for `terraform-scaffold.config.ts` in the project root to get:
- `functionPrefix` (PascalCase, e.g. `MyApp`)
- `environments` (default: `["staging", "production"]`)
- Custom paths (if any)

If no config exists, ask the user for these values before proceeding.

---

## Directory Structure

All generated projects follow this layout:

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
│   │   │   ├── lambda_function.tf          ← standalone lambdas go here
│   │   │   └── <model>.tf                  ← per-model resolver TF blocks
│   │   └── production/
│   │       ├── backend.hcl
│   │       ├── main.tf
│   │       ├── outputs.tf
│   │       ├── variables.tf
│   │       ├── versions.tf
│   │       └── terraform.tfvars.example
│   ├── functions/
│   │   ├── base.js                         ← hash validation pipeline function
│   │   ├── invoke.js                       ← Lambda invoke resolver
│   │   ├── none.js                         ← NONE datasource resolver
│   │   └── <resolverName>.js               ← per-resolver AppSync JS functions
│   ├── lambda/
│   │   ├── tsconfig.json
│   │   ├── src/<PREFIX><Name>/             ← Lambda source directories
│   │   │   ├── index.ts
│   │   │   ├── package.json
│   │   │   ├── AGENTS.md
│   │   │   └── GEMINI.md
│   │   └── dist/                           ← built zip files
│   └── modules/                            ← 18 Terraform modules (see references/terraform-modules.md)
├── services/                               ← AWS service wrappers
├── app/
│   ├── composables/                        ← Nuxt composables
│   └── graphql/                            ← typed GraphQL constants
└── utils/
    └── hash.ts
```

---

## Naming Conventions (CRITICAL)

| Concept | Convention | Example |
|---|---|---|
| Function prefix | PascalCase | `MyApp` |
| Full Lambda name | `<prefix><PascalSuffix>` | `MyAppRedeemNow` |
| Resolver name | camelCase | `productById` |
| GraphQL constant | SCREAMING_SNAKE_CASE | `PRODUCT_BY_ID` |
| TF module name | `appsync_function_<camelName>` | `appsync_function_productById` |
| TF lambda module | `lambda_function_<camelName>` | `lambda_function_productById` |
| Composable file | `use<Model>.ts` | `useProduct.ts` |
| GraphQL file | `<model>.ts` (lcfirst) | `product.ts` |
| TF file per model | `<model>.tf` (lcfirst) | `product.tf` |
| DynamoDB datasource | `appsync_datasource_<modelLower>` | `appsync_datasource_product` |
| DynamoDB table | `dynamodb_<modelLower>s` | `dynamodb_products` |
| Query index | `by<Field>` | `byUserId` |

### String Conversion Rules

- **toScreamingSnake**: `productById` → `PRODUCT_BY_ID` (split on uppercase boundaries, join with `_`, uppercase all)
- **toPascal**: capitalize first letter
- **lcfirst**: lowercase first letter

---

## Command 1: Init

Ask user for:
1. Project name (any string)
2. Function prefix (PascalCase, e.g. `MyApp`)
3. **AWS profile** — follow the AWS Profile Selection flow below
4. AWS region (default: `ap-southeast-2`)
5. S3 state bucket name
6. DynamoDB lock table name

### AWS Profile Selection

1. **Read existing profiles** by parsing `~/.aws/credentials` and `~/.aws/config` — extract all `[profile <name>]` and `[<name>]` section headers
2. **Present the list** to the user with a numbered selection (include `[default]` if it exists)
3. **Allow "add new"** — if the user's desired profile isn't listed, ask for the profile name and run `aws configure --profile <name>` to set it up, then continue
4. The selected profile name becomes `{{AWS_PROFILE}}`

Then generate files using templates from [references/init-templates.md](references/init-templates.md).

**Terraform modules** — all 18 reusable modules are documented in [references/terraform-modules.md](references/terraform-modules.md). Consult this reference when wiring up resources like `appsync_datasource`, `lambda_function`, `dynamodb_table`, `iam_role`, etc.

**Template placeholders** to replace:
- `{{PROJECT_NAME}}` → raw project name
- `{{PROJECT_KEBAB}}` → kebab-case version
- `{{FUNCTION_PREFIX}}` → PascalCase prefix
- `{{AWS_REGION}}` → chosen region
- `{{STATE_BUCKET}}` → S3 bucket name
- `{{LOCK_TABLE}}` → DynamoDB table name
- `{{AWS_PROFILE}}` → AWS CLI profile name

**Static files** (no placeholders): Copy exactly from template sources:
- `terraform/functions/base.js` — from [templates/init/functions/base.js](templates/init/functions/base.js)
- `terraform/functions/invoke.js` — from [templates/init/functions/invoke.js](templates/init/functions/invoke.js)
- `terraform/functions/none.js` — from [templates/init/functions/none.js](templates/init/functions/none.js)
- `terraform/lambda/tsconfig.json` — from [templates/init/lambda/tsconfig.json](templates/init/lambda/tsconfig.json)
- `services/cognitoService.ts` — from [templates/init/services/cognitoService.ts](templates/init/services/cognitoService.ts)
- `services/dynamodbService.ts` — from [templates/init/services/dynamodbService.ts](templates/init/services/dynamodbService.ts)
- `services/s3Service.ts` — from [templates/init/services/s3Service.ts](templates/init/services/s3Service.ts)
- `services/sesService.ts` — from [templates/init/services/sesService.ts](templates/init/services/sesService.ts)
- `services/netsuiteService.ts` — from [templates/init/services/netsuiteService.ts](templates/init/services/netsuiteService.ts)
- `services/textractService.ts` — from [templates/init/services/textractService.ts](templates/init/services/textractService.ts)
- `app/composables/useAuthState.ts` — from [templates/init/composables/useAuthState.ts](templates/init/composables/useAuthState.ts)
- `app/composables/useCognitoAuth.ts` — from [templates/init/composables/useCognitoAuth.ts](templates/init/composables/useCognitoAuth.ts)
- `app/composables/useGraphql.ts` — from [templates/init/composables/useGraphql.ts](templates/init/composables/useGraphql.ts)
- `utils/hash.ts` — from [templates/init/utils/hash.ts](templates/init/utils/hash.ts)

**Never overwrite existing files** — skip if file already exists.

**Copy scripts** from the skill's [scripts/](scripts/) directory into the target project's `scripts/` directory:
- `scripts/tf.ts` — terraform init/plan/apply wrapper
- `scripts/tf-output.ts` — export terraform outputs to .env files
- `scripts/lambda-build.ts` — bundle and zip Lambda functions with esbuild (requires `esbuild` and `archiver` as devDependencies)
- `scripts/sync-modules.ts` — sync terraform modules with drift detection

Then add these scripts to `package.json`:

```json
{
  "tf:init:staging": "bun scripts/tf.ts staging init",
  "tf:plan:staging": "bun scripts/tf.ts staging plan",
  "tf:apply:staging": "bun scripts/tf.ts staging apply",
  "tf:build:staging": "bun scripts/lambda-build.ts --env=staging",
  "tf:output:staging": "bun scripts/tf-output.ts staging",
  "tf:init:production": "bun scripts/tf.ts production init",
  "tf:plan:production": "bun scripts/tf.ts production plan",
  "tf:apply:production": "bun scripts/tf.ts production apply",
  "tf:build:production": "bun scripts/lambda-build.ts --env=production",
  "tf:output:production": "bun scripts/tf-output.ts production",
  "tf:sync-modules": "bun scripts/sync-modules.ts"
}
```

---

## Command 2: GraphQL Resolver

Ask user for:
1. **Model name** — must be a `@model` type from `schema.graphql` (PascalCase, e.g. `Product`)
2. **Resolver type** — `query` or `mutation`
3. **Resolver name** — camelCase (e.g. `productById`)
4. **Runtime** — `APPSYNC_JS` or `LAMBDA`
5. **DynamoDB operation** (APPSYNC_JS only) — one of: `GetItem`, `Query`, `PutItem`, `UpdateItem`, `Scan`, `BatchDeleteItem`
6. **Fields** — which model fields to include as arguments + optional extras (`payload: AWSJSON`, `filter: AWSJSON`, `limit: Int`, `nextToken: String`)

### What to generate:

#### A) Schema injection
Insert field into `type Query` or `type Mutation` block in `schema.graphql`:

```graphql
    <name>(<field>: <Type>, ...): <Model>       # singular for GetItem, PutItem, UpdateItem
    <name>(<field>: <Type>, ...): [<Model>]      # list for Query, Scan, BatchDeleteItem
```

**List operations** (return `[Model]`): `Query`, `Scan`, `BatchDeleteItem`
**Singular operations** (return `Model`): `GetItem`, `PutItem`, `UpdateItem`

Extra field type mappings: `payload` → `AWSJSON`, `filter` → `AWSJSON`, `limit` → `Int`, `nextToken` → `String`

#### B) GraphQL constant — `app/graphql/<model>.ts`
Create or append:

```typescript
export const PRODUCT_BY_ID = `
    query ProductById($id: ID!) {
        productById(id: $id) {
            id
            name
            createdAt
            updatedAt
        }
    }
`
```

- Operation type: `query` or `mutation`
- Operation name: PascalCase of resolver name
- Variable declarations use GraphQL types from schema (`$field: Type`)
- Response fields: only scalar fields from the model (filter out relation/object types)

#### C) Terraform modules — `terraform/envs/staging/<model>.tf`

**For APPSYNC_JS runtime** — append:

```hcl
module "appsync_function_<name>" {
  source           = "../../modules/appsync_function"
  api_id           = module.appsync.graphql_api_id
  function_name    = "<name>"
  data_source_name = module.appsync_datasource_<modelLower>.data_source_name
  code_path        = "../../functions/<name>.js"
}

module "appsync_pipeline_resolver_<name>" {
  source       = "../../modules/appsync_pipeline_resolver"
  api_id       = module.appsync.graphql_api_id
  type         = "<Query|Mutation>"
  field        = "<name>"
  code_path    = "../../functions/base.js"
  function_ids = [module.appsync_function_<name>.function_id]
}
```

**If `module "dynamodb_<modelLower>s"` is missing from `<model>.tf`**, generate it:

```hcl
module "dynamodb_<modelLower>s" {
  source     = "../../modules/dynamodb_table"
  name       = "${var.PROJECT_ENV}<Model>s"
  hash_key   = "id"
  attributes = [{ name = "id", type = "S" }]
}
```

Ask the user to confirm the hash_key, range_key, attributes, and GSIs based on their schema model.

**If `module "appsync_datasource_<modelLower>"` is missing**, generate it:

```hcl
module "appsync_datasource_<modelLower>" {
  source           = "../../modules/appsync_datasource"
  api_id           = module.appsync.graphql_api_id
  table_name       = module.dynamodb_<modelLower>s.table_name
  service_role_arn = module.role.appsync_role_arn
}
```

**If any of the following modules are missing from `main.tf`**, generate them using the templates below. These form the core dependency chain: `cognito_user_pool` → `cognito_user_pool_client` + `appsync` → `role`.

**Generation templates for missing dependency modules in `main.tf`:**

```hcl
module "cognito_user_pool" {
  source                       = "../../modules/cognito_user_pool"
  project                      = var.PROJECT_ENV
  from_email_address           = "no-reply@${var.DOMAIN_ONLY}"
  ses_identity_arn             = local.ses_identity_arn
  pre_signup_lambda_arn        = "<ask user or set to empty string>"
  custom_message_lambda_arn    = "<ask user or set to empty string>"
  post_confirmation_lambda_arn = "<ask user or set to empty string>"
}

module "cognito_user_pool_client" {
  source       = "../../modules/cognito_user_pool_client"
  project      = var.PROJECT_ENV
  user_pool_id = module.cognito_user_pool.user_pool_id
}

module "appsync" {
  source       = "../../modules/appsync"
  project      = var.PROJECT_ENV
  aws_region   = var.AWS_REGION
  schema_path  = "${path.module}/schema.graphql"
  user_pool_id = module.cognito_user_pool.user_pool_id
}

module "role" {
  source = "../../modules/iam_role"
  name   = var.PROJECT_ENV
}
```

For Lambda trigger ARNs marked `<ask user or set to empty string>`, if the trigger Lambdas don't exist yet, the user should create them first or provide empty strings temporarily.

**For LAMBDA runtime** — append (wrapped in `# Note: <name> START/END`):

```hcl
# Note: <name> START
module "lambda_function_<name>" {
  source               = "../../modules/lambda_function"
  lambda_function_name = "${var.PROJECT_ENV}<PascalName>"
  zip_path             = "../../${path.module}/lambda/dist/${var.PROJECT_ENV}<PascalName>.zip"
  handler              = "index.handler"
  lambda_role_arn      = module.role.lambda_role_arn
  environment_variables = {
    ENV            = var.ENV
    SERVER_VERSION = local.SERVER_VERSION
    PROJECT        = var.PROJECT_ENV
  }
}

module "appsync_datasource_<name>" {
  source           = "../../modules/appsync_datasource"
  api_id           = module.appsync.graphql_api_id
  lambda_arn       = module.lambda_function_<name>.lambda_function_arn
  service_role_arn = module.role.appsync_role_arn
}

module "appsync_function_<name>" {
  source           = "../../modules/appsync_function"
  api_id           = module.appsync.graphql_api_id
  function_name    = "<name>"
  data_source_name = module.appsync_datasource_<name>.data_source_name
  code_path        = "../../functions/invoke.js"
}

module "appsync_pipeline_resolver_<name>" {
  source       = "../../modules/appsync_pipeline_resolver"
  api_id       = module.appsync.graphql_api_id
  type         = "<Query|Mutation>"
  field        = "<name>"
  code_path    = "../../functions/base.js"
  function_ids = [module.appsync_function_<name>.function_id]
}
# Note: <name> END
```

#### D) AppSync JS function file (APPSYNC_JS only) — `terraform/functions/<name>.js`
Use the DynamoDB operation template from [templates/graphql/functions/](templates/graphql/functions/) (see [references/graphql-functions.md](references/graphql-functions.md) for the index).

For **GetItem** and **Query** templates, replace:
- `{{FIELD}}` → the key field name (e.g. `id`, `userId`)
- `{{INDEX}}` → `by<Field>` (e.g. `byUserId`) — Query only

#### E) Lambda source (LAMBDA only) — `terraform/lambda/src/<PREFIX><PascalName>/`
Create 4 files:
- `index.ts` — handler stub with `{{FULL_NAME}}` replaced
- `package.json` — `{"version":"0.0.1","lastBuildAt":""}`
- `AGENTS.md` — from template with `{{DESCRIPTION}}` = `"TODO: describe <Name> lambda purpose."`
- `GEMINI.md` — just `@./AGENTS.md`

See [templates/lambda/](templates/lambda/) (index at [references/lambda-templates.md](references/lambda-templates.md)).

#### F) Composable — `app/composables/use<Model>.ts`

**If file doesn't exist**, create new composable:

```typescript
import type { <Model> } from '~~/types/<Model>'
import { <CONST_NAME> } from '~/graphql/<modelLower>'
import useGraphql from '~/composables/useGraphql'

export function use<Model>() {
    const { getAccessToken } = useCognitoAuth()

    async function <name>(<params>) {
        const token = await getAccessToken()
        const { data, error } = await useGraphql<{ <name>: <ResponseType> }>(
            <CONST_NAME>,
            { <fields> },
            { key: 'fetch:<name>', token }
        )
        if (error.value) throw error.value
        return data.value?.data?.<name> ?? <fallback>
    }

    return { <name> }
}
```

**If file exists**, inject:
1. Add import for the new GraphQL constant
2. Add async function before `return {`
3. Add function name to `return { ... }`

**Response types**: `<Model>` for singular ops, `<Model>[]` for list ops.
**Fallback**: `null` for singular, `[]` for list.
**Param types**: Map GraphQL types → TS: `ID`/`String`/`AWSDateTime`/`AWSJSON` → `string`, `Int`/`Float` → `number`, `Boolean` → `boolean`.

---

## Command 3: Lambda Function

Ask user for:
1. **Name** — PascalCase suffix (e.g. `RedeemNow`)
2. **Type** — `standard` or `cron`
3. **Schedule** (cron only) — EventBridge expression (e.g. `rate(5 minutes)`)

Full name = `<functionPrefix><Name>` (e.g. `MyAppRedeemNow`).
camelSuffix = lcfirst of Name (e.g. `redeemNow`).

### What to generate:

#### A) Lambda source — `terraform/lambda/src/<fullName>/`
Same 4 files as GraphQL LAMBDA runtime (see above).

#### B) TF module — append to `terraform/envs/staging/lambda_function.tf`:

```hcl
module "lambda_function_<camelSuffix>" {
  source               = "../../modules/lambda_function"
  lambda_function_name = "${var.PROJECT_ENV}<PascalSuffix>"
  zip_path             = "../../${path.module}/lambda/dist/${var.PROJECT_ENV}<PascalSuffix>.zip"
  handler              = "index.handler"
  lambda_role_arn      = module.role.lambda_role_arn
  environment_variables = {
    ENV            = var.ENV
    SERVER_VERSION = local.SERVER_VERSION
    PROJECT        = var.PROJECT_ENV
  }
}
```

**If `module "role"` is missing from `main.tf`**, generate it using the generation templates in Command 2 Section C above. If `module "appsync"`, `module "cognito_user_pool"`, or `module "cognito_user_pool_client"` are also missing, generate them too — follow the full dependency chain.

#### C) Cron resources (cron type only) — append after module block:

```hcl
# <PascalSuffix> CRON START
resource "aws_cloudwatch_event_rule" "lambda_cron_<camelSuffix>" {
  name                = "${var.PROJECT_ENV}<PascalSuffix>Schedule"
  schedule_expression = "<schedule>"
}

resource "aws_cloudwatch_event_target" "lambda_cron_<camelSuffix>" {
  rule      = aws_cloudwatch_event_rule.lambda_cron_<camelSuffix>.name
  target_id = "${var.PROJECT_ENV}<PascalSuffix>"
  arn       = module.lambda_function_<camelSuffix>.lambda_function_arn
}

resource "aws_lambda_permission" "lambda_cron_<camelSuffix>" {
  statement_id  = "AllowExecutionFromEventBridge<PascalSuffix>"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_function_<camelSuffix>.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_cron_<camelSuffix>.arn
}
# <PascalSuffix> CRON END
```

---

## Idempotency Rules

- **Never overwrite** existing files during init
- **Skip** if a TF module block already exists (check for `module "appsync_function_<name>"`)
- **Skip** if a schema field already exists (check for `<name>(` in schema)
- **Skip** if a GraphQL constant already exists (check for `export const <CONST_NAME>`)
- **Skip** if a composable function already exists (check for `async function <name>(`)
- **Skip** Lambda source dir if it already exists
- When appending to files, trim trailing whitespace and add newline before new content

---

## Checklist Before Generating

- [ ] Read `terraform-scaffold.config.ts` for `functionPrefix`
- [ ] Read `schema.graphql` to understand existing models and fields
- [ ] Check existing TF files for duplicate modules
- [ ] Check existing graphql/ files for duplicate constants
- [ ] Check existing composables for duplicate functions
- [ ] Follow exact naming conventions (camelCase resolver, SCREAMING_SNAKE constant, etc.)
- [ ] Use exact indentation and formatting from templates
- [ ] Check referenced module dependencies exist in TF files; if missing, generate them:
  - **APPSYNC_JS resolver**: needs `module "dynamodb_<modelLower>s"` and `module "appsync_datasource_<modelLower>"` in `<model>.tf`
  - **LAMBDA resolver**: needs `module "role"` (in `main.tf`) — lambda_role_arn + appsync_role_arn
  - **Standalone Lambda**: needs `module "role"` (in `main.tf`) — lambda_role_arn
  - **All resolvers**: needs `module "appsync"` (in `main.tf`) — graphql_api_id
- [ ] When generating missing dependency modules, use the module signatures from [references/terraform-modules.md](references/terraform-modules.md) and wire them with the correct variables from existing modules

---

## Post-Generation Validation

After generating or modifying any `.tf` files, **always** run these steps from the env directory (e.g. `terraform/envs/staging/`):

1. **Format** — `terraform fmt <file>` on each generated/modified `.tf` file to auto-fix formatting
2. **Validate** — `terraform validate` to check for syntax errors, missing references, and config issues
3. **Fix** — if validation reports errors, read the error output, fix the generated code, and re-run `terraform fmt` + `terraform validate` until it passes
4. **Skip gracefully** — if `terraform validate` fails because providers are not initialized (`terraform init` not run), skip validation and inform the user they need to run `terraform init` first
