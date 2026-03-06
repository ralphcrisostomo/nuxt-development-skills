---
name: nuxt-terraform
description: "Scaffold Nuxt + AWS Terraform infrastructure. Use when adding GraphQL resolvers, Lambda functions, or initializing a new project with AppSync, DynamoDB, Cognito. Triggers on: add graphql resolver, create lambda, scaffold terraform, init terraform, add appsync resolver, add mutation, add query."
---

# Nuxt + Terraform Scaffold Skill

Generate files for Nuxt + AWS infrastructure projects. This skill replaces the CLI — generate all files directly.

## Pre-Requisites

Read `terraform-scaffold.config.ts` for `functionPrefix` (PascalCase), `environments`, and custom paths. If no config exists, ask the user for these values.

## Naming Conventions

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

String conversions: `toScreamingSnake` splits on uppercase, joins with `_`, uppercases. `toPascal` capitalizes first letter. `lcfirst` lowercases first letter.

## Command 1: Init

Ask user for: project name, function prefix (PascalCase), AWS profile, AWS region (default: `ap-southeast-2`), S3 state bucket, DynamoDB lock table.

**AWS Profile Selection**: Parse `~/.aws/credentials` and `~/.aws/config` for profile names. Present numbered list. Allow "add new" via `aws configure --profile <name>`.

Read [references/init-workflow.md](references/init-workflow.md) for directory structure, template placeholders, static files, scripts, and package.json entries. Consult [references/terraform-modules.md](references/terraform-modules.md) for all 18 reusable module signatures.

## Command 2: GraphQL Resolver

Ask user for:
1. **Model name** — `@model` type from `schema.graphql` (PascalCase)
2. **Resolver type** — `query` or `mutation`
3. **Resolver name** — camelCase (e.g. `productById`)
4. **Runtime** — `APPSYNC_JS` or `LAMBDA`
5. **DynamoDB operation** (APPSYNC_JS only) — `GetItem`, `Query`, `PutItem`, `UpdateItem`, `Scan`, `BatchDeleteItem`
6. **Fields** — model fields as arguments + optional extras (`payload: AWSJSON`, `filter: AWSJSON`, `limit: Int`, `nextToken: String`)

Read [references/resolver-workflow.md](references/resolver-workflow.md) for all generation templates: schema injection, GraphQL constant, Terraform modules (APPSYNC_JS and LAMBDA), dependency modules, AppSync JS functions, Lambda source, and composable generation.

## Command 3: Lambda Function

Ask user for:
1. **Name** — PascalCase suffix (e.g. `RedeemNow`)
2. **Type** — `standard` or `cron`
3. **Schedule** (cron only) — EventBridge expression (e.g. `rate(5 minutes)`)

Read [references/lambda-workflow.md](references/lambda-workflow.md) for Lambda source files, TF module block, cron resources, and dependency checks.

## Rules

**Idempotency** — never overwrite existing files during init. Skip if TF module, schema field, GraphQL constant, composable function, or Lambda source already exists. When appending, trim trailing whitespace and add newline before new content.

**Pre-generation checklist**:
- Read `terraform-scaffold.config.ts` for `functionPrefix`
- Read `schema.graphql` for existing models and fields
- Check TF files, graphql/ files, and composables for duplicates
- Follow exact naming conventions from the table above
- Verify module dependencies exist; generate if missing (see resolver-workflow.md dependency modules section)

**Post-generation validation**: Run `terraform fmt` on modified `.tf` files, then `terraform validate`. If providers not initialized, skip and inform user to run `terraform init` first.
