# Resolver Workflow

Read this file when running Command 2 (GraphQL Resolver). Contains all generation templates step by step.

## A) Schema Injection

Insert field into `type Query` or `type Mutation` block in `schema.graphql`:

```graphql
    <name>(<field>: <Type>, ...): <Model>       # singular for GetItem, PutItem, UpdateItem
    <name>(<field>: <Type>, ...): [<Model>]      # list for Query, Scan, BatchDeleteItem
```

**List operations** (return `[Model]`): `Query`, `Scan`, `BatchDeleteItem`
**Singular operations** (return `Model`): `GetItem`, `PutItem`, `UpdateItem`

Extra field type mappings: `payload` → `AWSJSON`, `filter` → `AWSJSON`, `limit` → `Int`, `nextToken` → `String`

## B) GraphQL Constant — `app/graphql/<model>.ts`

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

## C) Terraform Modules — `terraform/envs/staging/<model>.tf`

### APPSYNC_JS Runtime

Append:

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

**If `module "dynamodb_<modelLower>s"` is missing from `<model>.tf`:**

```hcl
module "dynamodb_<modelLower>s" {
  source     = "../../modules/dynamodb_table"
  name       = "${var.PROJECT_ENV}<Model>s"
  hash_key   = "id"
  attributes = [{ name = "id", type = "S" }]
}
```

Ask the user to confirm hash_key, range_key, attributes, and GSIs based on their schema model.

**If `module "appsync_datasource_<modelLower>"` is missing:**

```hcl
module "appsync_datasource_<modelLower>" {
  source           = "../../modules/appsync_datasource"
  api_id           = module.appsync.graphql_api_id
  table_name       = module.dynamodb_<modelLower>s.table_name
  service_role_arn = module.role.appsync_role_arn
}
```

### Dependency Modules — `main.tf`

If any of the following are missing from `main.tf`, generate them. Dependency chain: `cognito_user_pool` → `cognito_user_pool_client` + `appsync` → `role`.

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

For Lambda trigger ARNs marked `<ask user or set to empty string>`, if the trigger Lambdas don't exist yet, use empty strings temporarily.

### LAMBDA Runtime

Append (wrapped in `# Note: <name> START/END`):

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

## D) AppSync JS Function (APPSYNC_JS only) — `terraform/functions/<name>.js`

> **Tip:** These templates cover standard DynamoDB CRUD. For resolver code with query filters, conditional expressions, non-DynamoDB data sources (HTTP, RDS, OpenSearch, EventBridge, NONE), or pipeline resolvers, consult the aws-appsync-resolver skill — especially `references/dynamodb.md` for high-level `ddb.*` helpers.

Use the DynamoDB operation template:

| Operation | Placeholders | Source |
|---|---|---|
| `GetItem` | `{{FIELD}}` — key field name | [templates/graphql/functions/GetItem.js.tpl](../templates/graphql/functions/GetItem.js.tpl) |
| `Query` | `{{FIELD}}` — partition key, `{{INDEX}}` — GSI name (`by<Field>`) | [templates/graphql/functions/Query.js.tpl](../templates/graphql/functions/Query.js.tpl) |
| `PutItem` | None | [templates/graphql/functions/PutItem.js.tpl](../templates/graphql/functions/PutItem.js.tpl) |
| `UpdateItem` | None | [templates/graphql/functions/UpdateItem.js.tpl](../templates/graphql/functions/UpdateItem.js.tpl) |
| `Scan` | None | [templates/graphql/functions/Scan.js.tpl](../templates/graphql/functions/Scan.js.tpl) |
| `BatchDeleteItem` | None | [templates/graphql/functions/BatchDeleteItem.js.tpl](../templates/graphql/functions/BatchDeleteItem.js.tpl) |

Placeholder reference: `{{FIELD}}` = key field name (e.g. `id`, `userId`). `{{INDEX}}` = GSI name, typically `by<Field>`.

## E) Lambda Source (LAMBDA only) — `terraform/lambda/src/<PREFIX><PascalName>/`

| File | Placeholders | Source |
|---|---|---|
| `index.ts` | `{{FULL_NAME}}` | [templates/lambda/index.ts.tpl](../templates/lambda/index.ts.tpl) |
| `package.json` | None — `{"version":"0.0.1","lastBuildAt":""}` | _(inline)_ |
| `AGENTS.md` | `{{DESCRIPTION}}` = `"TODO: describe <Name> lambda purpose."` | [templates/lambda/AGENTS.md.tpl](../templates/lambda/AGENTS.md.tpl) |
| `GEMINI.md` | None — just `@./AGENTS.md` | [templates/lambda/GEMINI.md.tpl](../templates/lambda/GEMINI.md.tpl) |

## F) Composable — `app/composables/use<Model>.ts`

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
**Param types**: Map GraphQL → TS: `ID`/`String`/`AWSDateTime`/`AWSJSON` → `string`, `Int`/`Float` → `number`, `Boolean` → `boolean`.
