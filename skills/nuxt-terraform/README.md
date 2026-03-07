# Nuxt Terraform Skill

A Claude Code skill that scaffolds full-stack **Nuxt 4 + AWS Terraform** infrastructure. It generates Terraform IaC, AppSync GraphQL resolvers, Lambda functions, and Nuxt frontend code from conversational prompts.

## Triggers

- `init terraform` / `scaffold terraform`
- `add graphql resolver` / `add appsync resolver`
- `add mutation` / `add query`
- `create lambda`
- `add terraform test` / `write tftest`
- `terraform style` (style guide enforcement)

## AWS Services

| Service | Purpose |
|---------|---------|
| AppSync | GraphQL API (Cognito + API key auth) |
| DynamoDB | NoSQL database (PAY_PER_REQUEST) |
| Lambda | Compute for resolvers and standalone functions |
| Cognito | User authentication (sign-up, MFA, JWT) |
| S3 | Public, private, and SPA hosting buckets |
| CloudFront | CDN for SPA distribution |
| API Gateway | HTTP API proxy to Lambda |
| SES | Transactional email |
| CloudWatch | EventBridge cron scheduling |
| Route 53 | DNS management |
| ACM | TLS certificates |
| IAM | Role-based access control |
| Budgets | Cost monitoring and alerts |

## Terraform Modules (18)

All modules are copied to `terraform/modules/` during init:

| Module | Description |
|--------|-------------|
| `app_base` | Namespace computation (`<project>-<env>`) |
| `appsync` | GraphQL API with dual auth (Cognito + API key) |
| `appsync_datasource` | DynamoDB or Lambda data source binding |
| `appsync_function` | Pipeline functions (APPSYNC_JS runtime) |
| `appsync_pipeline_resolver` | Field resolver wiring |
| `acm_certificates` | TLS certificates with SANs |
| `api_gateway_cloudfront` | CloudFront + API Gateway custom domain |
| `budgets_cost_alerts` | AWS Budget cost alerts |
| `cognito_user_pool` | User pool with SES email triggers |
| `cognito_user_pool_client` | OAuth client configuration |
| `dynamodb_table` | Tables with GSI support |
| `iam_role` | Lambda + AppSync execution roles |
| `lambda_api_gateway` | HTTP API Gateway proxying to Lambda |
| `lambda_function` | Lambda deployment from local zip |
| `route_53` | DNS alias records |
| `s3_cloudfront` | SPA hosting with CloudFront CDN |
| `s3_private_storage` | Private bucket with optional IAM credentials |
| `s3_public_storage` | Public bucket |

## Workflows

### 1. Init

Scaffolds the entire project structure with multi-environment support (staging + production).

**User provides:** project name, function prefix (PascalCase), AWS region, S3 state bucket, DynamoDB lock table.

**Generated structure:**

```
<project-root>/
├── terraform-scaffold.config.ts
├── terraform/
│   ├── envs/
│   │   ├── staging/        (backend.hcl, main.tf, variables.tf, outputs.tf, versions.tf, schema.graphql)
│   │   └── production/     (same)
│   ├── functions/          (base.js, invoke.js, none.js)
│   ├── lambda/
│   │   ├── tsconfig.json
│   │   ├── src/            (Lambda source)
│   │   └── dist/           (built zips)
│   └── modules/            (18 Terraform modules)
├── services/               (cognito, dynamodb, s3, ses, netsuite, textract)
├── app/
│   ├── composables/        (useAuthState, useCognitoAuth, useGraphql)
│   └── graphql/            (GraphQL constants)
└── utils/
    └── hash.ts
```

**Scripts copied to `scripts/tf/`:**

| Script | Purpose |
|--------|---------|
| `scripts/tf/tf-run.ts` | Terraform init/plan/apply wrapper per environment |
| `scripts/tf/tf-output.ts` | Export terraform outputs to `.env` files |
| `scripts/tf/tf-lambda-build.ts` | Bundle + zip Lambda functions with esbuild |
| `scripts/tf/tf-sync-modules.ts` | Sync terraform modules with drift detection |

**package.json scripts added:**

```
tf:init:staging      tf:init:production
tf:plan:staging      tf:plan:production
tf:apply:staging     tf:apply:production
tf:build:staging     tf:build:production
tf:output:staging    tf:output:production
tf:sync-modules
```

### 2. Add GraphQL Resolver

Generates a complete AppSync resolver with all supporting code.

**User provides:** model name, resolver type (query/mutation), resolver name, runtime (APPSYNC_JS or LAMBDA), DynamoDB operation, and field arguments.

**DynamoDB operations (APPSYNC_JS):** GetItem, Query, PutItem, UpdateItem, Scan, BatchDeleteItem

> For advanced resolver patterns (query filters, conditional writes, non-DynamoDB data sources, pipeline resolvers), see the companion [aws-appsync-resolver skill](../aws-appsync-resolver-skill/).

**Generated artifacts:**
- Schema injection into `schema.graphql`
- GraphQL constant in `app/graphql/<model>.ts`
- Terraform module blocks in `terraform/envs/staging/<model>.tf`
- AppSync JS function in `terraform/functions/<name>.js` (APPSYNC_JS)
- Lambda source in `terraform/lambda/src/` (LAMBDA)
- Composable function in `app/composables/use<Model>.ts`

### 3. Create Lambda Function

Generates a standalone Lambda function (standard or cron-triggered).

**User provides:** name (PascalCase), type (standard/cron), schedule expression (cron only).

**Generated artifacts:**
- Lambda source in `terraform/lambda/src/<prefix><Name>/`
- Terraform module in `terraform/envs/staging/lambda_function.tf`
- EventBridge cron rule + target + permission (cron type only)

### 4. Terraform Test

Generates `.tftest.hcl` test files for Terraform modules using Terraform's built-in testing framework.

**User provides:** module path, test type (unit/integration/mock), scenarios to validate.

**Test types:**
| Type | Mode | Resources | Credentials |
|------|------|-----------|-------------|
| Unit | `plan` | None | Required |
| Integration | `apply` | Real | Required |
| Mock | `plan` + mock providers | None | Not needed |

**Generated artifacts:**
- Test file in `terraform/modules/<module>/tests/<name>_<type>_test.tftest.hcl`
- Mock provider blocks (mock type only)

### 5. Style Guide

All generated Terraform code follows HashiCorp's official style conventions:
- Two-space indent, aligned equals signs
- Standard file organization (`terraform.tf`, `providers.tf`, `main.tf`, `variables.tf`, `outputs.tf`, `locals.tf`)
- Variables with `type` + `description`, outputs with `description`
- Lowercase underscore naming, singular resource names
- Security hardening defaults (encryption, private networking, least privilege)
- `for_each` over `count` for multiple resources

## Nuxt Composables

| Composable | Purpose |
|------------|---------|
| `useAuthState` | Reactive auth state with role-based cookies for SSR |
| `useCognitoAuth` | Full Cognito auth flow (sign-in, sign-up, confirm, forgot password, token refresh) |
| `useGraphql` | SSR-safe AppSync client with djb2 hash signing and Bearer token auth |

## Services

| Service | SDK |
|---------|-----|
| `cognitoService` | `@aws-sdk/client-cognito-identity-provider` |
| `dynamodbService` | `@aws-sdk/lib-dynamodb` |
| `s3Service` | `@aws-sdk/client-s3` |
| `sesService` | `@aws-sdk/client-ses` + `mimetext` |
| `netsuiteService` | OAuth 1.0 HMAC-SHA256 REST client |
| `textractService` | `@aws-sdk/client-textract` |

## Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Function prefix | PascalCase | `MyApp` |
| Lambda full name | `<prefix><Suffix>` | `MyAppRedeemNow` |
| Resolver name | camelCase | `productById` |
| GraphQL constant | SCREAMING_SNAKE | `PRODUCT_BY_ID` |
| TF module name | `<type>_<camelName>` | `appsync_function_productById` |
| Composable file | `use<Model>.ts` | `useProduct.ts` |
| GraphQL file | `<model>.ts` | `product.ts` |
| TF model file | `<model>.tf` | `product.tf` |

## Idempotency

All operations are safe to re-run:
- Never overwrites existing files during init
- Skips Terraform module blocks if they already exist
- Skips schema fields, GraphQL constants, composable functions, and Lambda directories if present

## References

Detailed documentation for each component lives in `references/`:

- `terraform-modules.md` - All 18 module specs
- `terraform-style-guide.md` - HashiCorp style conventions and code review checklist
- `terraform-test.md` - Built-in testing framework (.tftest.hcl), mock providers, CI/CD
- `init-templates.md` - Project scaffold files
- `composables.md` - Auth state, Cognito auth, GraphQL client
- `services.md` - Cognito, DynamoDB, S3, SES, NetSuite, Textract
- `graphql-functions.md` - DynamoDB operation templates
- `lambda-templates.md` - Handler, package.json, agent docs
- `functions.md` - base.js, invoke.js, none.js pipeline functions
- `utils.md` - djb2 hash utility
