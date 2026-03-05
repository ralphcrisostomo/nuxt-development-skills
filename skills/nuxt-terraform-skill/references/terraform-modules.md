# Terraform Modules Reference

All 18 reusable Terraform modules are copied to `terraform/modules/` during `init`. Source `.tf` files live in [`../terraform-modules/`](../terraform-modules/). This index provides a quick lookup of each module's purpose, variables, and outputs.

---

## Module Index

| Module | Purpose |
|---|---|
| [`acm_certificates`](#acm_certificates) | TLS cert with SANs |
| [`api_gateway_cloudfront`](#api_gateway_cloudfront) | CloudFront + API Gateway custom domain |
| [`app_base`](#app_base) | Namespace computation (`<project>-<env>`) |
| [`appsync`](#appsync) | AppSync GraphQL API + Cognito auth + API key |
| [`appsync_datasource`](#appsync_datasource) | DynamoDB or Lambda data source |
| [`appsync_function`](#appsync_function) | Pipeline function (APPSYNC_JS) |
| [`appsync_pipeline_resolver`](#appsync_pipeline_resolver) | Pipeline resolver for a field |
| [`budgets_cost_alerts`](#budgets_cost_alerts) | AWS Budget alarms |
| [`cognito_user_pool`](#cognito_user_pool) | Cognito pool with SES + Lambda triggers |
| [`cognito_user_pool_client`](#cognito_user_pool_client) | Cognito app client with OAuth |
| [`dynamodb_table`](#dynamodb_table) | PAY_PER_REQUEST table with GSIs |
| [`iam_role`](#iam_role) | Lambda + AppSync roles with conditional policies |
| [`lambda_api_gateway`](#lambda_api_gateway) | HTTP API Gateway proxying to Lambda |
| [`lambda_function`](#lambda_function) | Lambda from local zip |
| [`route_53`](#route_53) | Alias DNS records |
| [`s3_cloudfront`](#s3_cloudfront) | SPA hosting with CDN |
| [`s3_private_storage`](#s3_private_storage) | Private bucket with optional IAM credentials |
| [`s3_public_storage`](#s3_public_storage) | Publicly readable bucket |

---

## acm_certificates

TLS certificate with Subject Alternative Names.

See [main.tf](../terraform-modules/acm_certificates/main.tf) | [variables.tf](../terraform-modules/acm_certificates/variables.tf) | [outputs.tf](../terraform-modules/acm_certificates/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `region` | `string` | yes | Region label used for naming and tags |
| `domain` | `string` | yes | Base domain for the certificate |
| `prefixes` | `list(string)` | no | SAN prefixes (e.g. `["api", "staging"]`) |
| `validation_method` | `string` | no | Validation method (default DNS) |
| `tags` | `map(string)` | no | Resource tags |

| Output | Description |
|---|---|
| `certificate_arn` | ACM certificate ARN |
| `domain_name` | Certificate domain name |
| `subject_alternative_names` | SANs on the certificate |
| `domain_validation_options` | CNAME records for DNS validation |

---

## api_gateway_cloudfront

CloudFront distribution in front of API Gateway with a custom domain.

See [main.tf](../terraform-modules/api_gateway_cloudfront/main.tf) | [variables.tf](../terraform-modules/api_gateway_cloudfront/variables.tf) | [outputs.tf](../terraform-modules/api_gateway_cloudfront/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `env` | `string` | yes | Environment name (e.g. staging, production) |
| `region` | `string` | yes | Region label for naming (e.g. AU, NZ) |
| `domain` | `string` | yes | Base domain for the API alias |
| `project` | `string` | yes | Project identifier for resource naming |
| `certificate_arn_regional` | `string` | yes | Regional ACM cert ARN for API Gateway custom domain |
| `certificate_arn_us_east_1` | `string` | yes | us-east-1 ACM cert ARN for CloudFront |
| `api_id` | `string` | yes | API Gateway ID |
| `api_stage` | `string` | yes | API Gateway stage name |

| Output | Description |
|---|---|
| `custom_domain_name` | API Gateway custom domain name |
| `api_gateway_target_domain` | Target domain of the API Gateway |
| `cloudfront_distribution_id` | CloudFront distribution ID |
| `cloudfront_domain_name` | CloudFront domain name |
| `cloudfront_hosted_zone_id` | CloudFront hosted zone ID |

---

## app_base

Computes a normalized namespace string (`<project>-<env>`) used across all resources.

See [main.tf](../terraform-modules/app_base/main.tf) | [variables.tf](../terraform-modules/app_base/variables.tf) | [outputs.tf](../terraform-modules/app_base/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `project_name` | `string` | yes | Project identifier |
| `environment` | `string` | yes | Environment name |

| Output | Description |
|---|---|
| `namespace` | Normalized namespace for resources |

---

## appsync

AppSync GraphQL API with Cognito User Pool authentication and API key.

See [main.tf](../terraform-modules/appsync/main.tf) | [variables.tf](../terraform-modules/appsync/variables.tf) | [outputs.tf](../terraform-modules/appsync/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `project` | `string` | yes | Project name prefix |
| `aws_region` | `string` | yes | AWS region |
| `schema_path` | `string` | no | Path to GraphQL schema file |
| `user_pool_id` | `string` | yes | Cognito User Pool ID |

| Output | Description |
|---|---|
| `graphql_api_id` | AppSync API ID |
| `graphql_api_url` | AppSync GraphQL endpoint URL |
| `api_key` | AppSync API key |
| `authentication_type` | Authentication type used by the API |

---

## appsync_datasource

Attaches a DynamoDB table or Lambda function as an AppSync data source.

See [main.tf](../terraform-modules/appsync_datasource/main.tf) | [variables.tf](../terraform-modules/appsync_datasource/variables.tf) | [outputs.tf](../terraform-modules/appsync_datasource/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `api_id` | `string` | yes | AppSync API ID |
| `table_name` | `string` | no | DynamoDB table name (leave empty if not using DynamoDB) |
| `lambda_arn` | `string` | no | Lambda ARN (leave empty if not using Lambda) |
| `service_role_arn` | `string` | yes | IAM Role ARN for AppSync |

| Output | Description |
|---|---|
| `data_source_name` | Created data source name |

---

## appsync_function

Pipeline function using APPSYNC_JS runtime with optional template support.

See [main.tf](../terraform-modules/appsync_function/main.tf) | [variables.tf](../terraform-modules/appsync_function/variables.tf) | [outputs.tf](../terraform-modules/appsync_function/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `api_id` | `string` | yes | AppSync API ID |
| `function_name` | `string` | yes | Name of the AppSync function |
| `data_source_name` | `string` | yes | AppSync Data Source name |
| `code_path` | `string` | no | Path to plain JS resolver file |
| `is_template` | `bool` | no | Whether code is a template file |
| `environment_variables` | `map(string)` | no | Values exposed as ENVIRONMENT_VARIABLES |
| `template_vars` | `map(string)` | no | Additional templatefile variables |
| `runtime_name` | `string` | no | AppSync runtime name |
| `runtime_version` | `string` | no | AppSync runtime version |

| Output | Description |
|---|---|
| `function_id` | AppSync Function ID |

---

## appsync_pipeline_resolver

Pipeline resolver that wires a GraphQL field to a chain of AppSync functions.

See [main.tf](../terraform-modules/appsync_pipeline_resolver/main.tf) | [variables.tf](../terraform-modules/appsync_pipeline_resolver/variables.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `api_id` | `string` | yes | AppSync API ID |
| `type` | `string` | yes | GraphQL type (e.g. Mutation, Query) |
| `field` | `string` | yes | Field name in the schema |
| `code_path` | `string` | yes | Path to the base function code |
| `function_ids` | `list(string)` | yes | AppSync function IDs for the pipeline |
| `runtime_name` | `string` | no | AppSync runtime name |
| `runtime_version` | `string` | no | AppSync runtime version |

_No outputs._

---

## budgets_cost_alerts

AWS Budget alarms with email and/or SNS notifications.

See [main.tf](../terraform-modules/budgets_cost_alerts/main.tf) | [variables.tf](../terraform-modules/budgets_cost_alerts/variables.tf) | [outputs.tf](../terraform-modules/budgets_cost_alerts/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `enabled` | `bool` | no | Whether to create budget resources |
| `account_id` | `string` | no | AWS account ID (defaults to current caller) |
| `name_prefix` | `string` | yes | Prefix for budget names |
| `limit_amount_usd` | `number` | no | Monthly budget in USD |
| `time_unit` | `string` | no | Budget time unit |
| `threshold_percentage` | `number` | no | Alert threshold percentage |
| `notification_types` | `set(string)` | no | Notification types to create |
| `email_addresses` | `list(string)` | no | Email recipients for alerts |
| `sns_topic_arns` | `list(string)` | no | SNS topic ARNs for alerts |
| `service_names` | `list(string)` | no | AWS service names for per-service budgets |
| `include_total_budget` | `bool` | no | Create a total account budget |
| `include_service_budgets` | `bool` | no | Create per-service budgets |

| Output | Description |
|---|---|
| `alerts_are_active` | Whether alerts are active |
| `total_budget_name` | Total monthly budget name |
| `service_budget_names` | Map of service → budget name |

---

## cognito_user_pool

Cognito User Pool with SES email, Lambda triggers, and optional custom schema attributes.

See [main.tf](../terraform-modules/cognito_user_pool/main.tf) | [variables.tf](../terraform-modules/cognito_user_pool/variables.tf) | [outputs.tf](../terraform-modules/cognito_user_pool/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `project` | `string` | yes | Project name for the User Pool |
| `from_email_address` | `string` | yes | "From" email (must match SES-verified identity) |
| `ses_identity_arn` | `string` | yes | SES verified identity ARN |
| `pre_signup_lambda_arn` | `string` | yes | Pre sign-up trigger Lambda ARN |
| `custom_message_lambda_arn` | `string` | yes | CustomMessage trigger Lambda ARN |
| `post_confirmation_lambda_arn` | `string` | yes | PostConfirmation trigger Lambda ARN |
| `custom_schema` | `list(object)` | no | Custom schema attributes |

| Output | Description |
|---|---|
| `user_pool_id` | Cognito User Pool ID |
| `user_pool_arn` | Cognito User Pool ARN |

---

## cognito_user_pool_client

Cognito app client with OAuth flows and configurable token validity.

See [main.tf](../terraform-modules/cognito_user_pool_client/main.tf) | [variables.tf](../terraform-modules/cognito_user_pool_client/variables.tf) | [outputs.tf](../terraform-modules/cognito_user_pool_client/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `project` | `string` | yes | Project name for the client |
| `user_pool_id` | `string` | yes | Cognito User Pool ID |
| `callback_urls` | `list(string)` | no | Allowed OAuth callback URLs |
| `logout_urls` | `list(string)` | no | Allowed logout URLs |
| `access_token_validity` | `number` | no | Access token validity (minutes) |
| `id_token_validity` | `number` | no | ID token validity (minutes) |
| `refresh_token_validity` | `number` | no | Refresh token validity (minutes) |

| Output | Description |
|---|---|
| `user_pool_client_id` | Cognito User Pool Client ID |

---

## dynamodb_table

PAY_PER_REQUEST DynamoDB table with optional GSIs.

See [main.tf](../terraform-modules/dynamodb_table/main.tf) | [variables.tf](../terraform-modules/dynamodb_table/variables.tf) | [outputs.tf](../terraform-modules/dynamodb_table/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Table name |
| `hash_key` | `string` | yes | Partition key name |
| `range_key` | `string` | no | Sort key name |
| `attributes` | `list(object)` | yes | Attribute definitions (`{name, type}`) |
| `global_secondary_indexes` | `list(object)` | no | GSI definitions (`{name, hash_key, range_key, projection_type, non_key_attributes}`) |

| Output | Description |
|---|---|
| `table_name` | DynamoDB table name |
| `table_arn` | DynamoDB table ARN |
| `index_arns` | GSI ARNs |

---

## iam_role

IAM roles for Lambda and AppSync with conditional policies for DynamoDB, S3, SES, Cognito, Lambda invoke, and SNS.

See [main.tf](../terraform-modules/iam_role/main.tf) | [variables.tf](../terraform-modules/iam_role/variables.tf) | [outputs.tf](../terraform-modules/iam_role/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | IAM role name |
| `lambda_dynamodb_table_arns` | `list(string)` | no | DynamoDB ARNs for Lambda role |
| `appsync_dynamodb_table_arns` | `list(string)` | no | DynamoDB ARNs for AppSync role |
| `s3_bucket_arns` | `list(string)` | no | S3 bucket ARNs |
| `ses_identity_arns` | `list(string)` | no | SES identity ARNs |
| `cognito_user_pool_arns` | `list(string)` | no | Cognito User Pool ARNs |
| `lambda_arns` | `list(string)` | no | Lambda ARNs for invoke permission |
| `sns_platform_application_arns` | `list(string)` | no | SNS platform application ARNs |

| Output | Description |
|---|---|
| `lambda_role_arn` | Lambda execution role ARN |
| `lambda_role_name` | Lambda execution role name |
| `appsync_role_arn` | AppSync service role ARN |

---

## lambda_api_gateway

HTTP API Gateway that proxies all requests to a Lambda function.

See [main.tf](../terraform-modules/lambda_api_gateway/main.tf) | [variables.tf](../terraform-modules/lambda_api_gateway/variables.tf) | [outputs.tf](../terraform-modules/lambda_api_gateway/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `api_name` | `string` | yes | API Gateway name |
| `lambda_function_name` | `string` | yes | Lambda function name |
| `lambda_function_arn` | `string` | yes | Lambda function ARN |
| `integration_timeout_milliseconds` | `number` | no | Lambda integration timeout (50–30000 ms) |

| Output | Description |
|---|---|
| `api_gateway_id` | API Gateway ID |
| `api_gateway_endpoint` | Default API Gateway endpoint |
| `api_stage_name` | Stage name |
| `api_execution_arn` | API execution ARN |

---

## lambda_function

Lambda function deployed from a local zip package.

See [main.tf](../terraform-modules/lambda_function/main.tf) | [variables.tf](../terraform-modules/lambda_function/variables.tf) | [outputs.tf](../terraform-modules/lambda_function/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `lambda_function_name` | `string` | yes | Lambda function name |
| `zip_path` | `string` | yes | Path to the deployment zip |
| `handler` | `string` | yes | Handler (e.g. `index.handler`) |
| `runtime` | `string` | no | Lambda runtime |
| `timeout` | `number` | no | Timeout in seconds |
| `memory_size` | `number` | no | Memory in MB |
| `environment_variables` | `map(string)` | no | Environment variables |
| `layers` | `list(string)` | no | Lambda layer ARNs |
| `lambda_role_arn` | `string` | yes | IAM Role ARN for Lambda |

| Output | Description |
|---|---|
| `lambda_function_name` | Lambda function name |
| `lambda_function_arn` | Lambda function ARN |

---

## route_53

Creates an alias DNS record in Route 53.

See [main.tf](../terraform-modules/route_53/main.tf) | [variables.tf](../terraform-modules/route_53/variables.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `zone_name` | `string` | yes | Route 53 hosted zone name |
| `record_name` | `string` | yes | DNS record name to create |
| `target_domain_name` | `string` | yes | Alias target domain name |
| `target_hosted_zone_id` | `string` | yes | Alias target hosted zone ID |

_No outputs._

---

## s3_cloudfront

S3 bucket with CloudFront distribution for SPA hosting.

See [main.tf](../terraform-modules/s3_cloudfront/main.tf) | [variables.tf](../terraform-modules/s3_cloudfront/variables.tf) | [outputs.tf](../terraform-modules/s3_cloudfront/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `env` | `string` | yes | Environment name |
| `region` | `string` | yes | AWS region identifier |
| `domain` | `string` | yes | Custom domain (empty string to skip) |
| `project` | `string` | yes | Project identifier |
| `bucket` | `string` | yes | S3 bucket name |
| `acm_certificate_arn` | `string` | yes | us-east-1 ACM cert ARN |

| Output | Description |
|---|---|
| `s3_bucket_name` | S3 bucket name |
| `s3_bucket_arn` | S3 bucket ARN |
| `s3_website_url` | S3 website URL |
| `cloudfront_distribution_id` | CloudFront distribution ID |
| `cloudfront_domain_name` | CloudFront domain name |

---

## s3_private_storage

Private S3 bucket with optional IAM user credentials for programmatic access.

See [main.tf](../terraform-modules/s3_private_storage/main.tf) | [variables.tf](../terraform-modules/s3_private_storage/variables.tf) | [outputs.tf](../terraform-modules/s3_private_storage/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `bucket` | `string` | yes | Bucket name |
| `force_destroy` | `bool` | no | Allow destroy with objects |
| `create_access_credentials` | `bool` | no | Create IAM user with access key |
| `iam_user_name` | `string` | no | IAM user name (auto-generated if empty) |
| `allowed_actions` | `list(string)` | no | S3 actions for the IAM user |

| Output | Description |
|---|---|
| `s3_bucket_name` | S3 bucket name |
| `s3_bucket_arn` | S3 bucket ARN |
| `s3_bucket_url` | S3 bucket URL |
| `access_key_id` | IAM access key (when credentials enabled) |
| `secret_access_key` | IAM secret key (sensitive, when credentials enabled) |

---

## s3_public_storage

Publicly readable S3 bucket.

See [main.tf](../terraform-modules/s3_public_storage/main.tf) | [variables.tf](../terraform-modules/s3_public_storage/variables.tf) | [outputs.tf](../terraform-modules/s3_public_storage/outputs.tf)

| Variable | Type | Required | Description |
|---|---|---|---|
| `bucket` | `string` | yes | Bucket name |

| Output | Description |
|---|---|
| `s3_bucket_name` | S3 bucket name |
| `s3_bucket_arn` | S3 bucket ARN |
| `s3_bucket_url` | S3 bucket URL |
