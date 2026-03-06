# Lambda Function Workflow

Read this file when running Command 3 (Standalone Lambda). Contains TF module blocks, cron resources, and Lambda source templates.

Full name = `<functionPrefix><Name>` (e.g. `MyAppRedeemNow`).
camelSuffix = lcfirst of Name (e.g. `redeemNow`).

## A) Lambda Source — `terraform/lambda/src/<fullName>/`

Same 4 files as resolver LAMBDA runtime:

| File | Placeholders | Source |
|---|---|---|
| `index.ts` | `{{FULL_NAME}}` | [templates/lambda/index.ts.tpl](../templates/lambda/index.ts.tpl) |
| `package.json` | None — `{"version":"0.0.1","lastBuildAt":""}` | _(inline)_ |
| `AGENTS.md` | `{{DESCRIPTION}}` = `"TODO: describe <Name> lambda purpose."` | [templates/lambda/AGENTS.md.tpl](../templates/lambda/AGENTS.md.tpl) |
| `GEMINI.md` | None — just `@./AGENTS.md` | [templates/lambda/GEMINI.md.tpl](../templates/lambda/GEMINI.md.tpl) |

## B) TF Module — append to `terraform/envs/staging/lambda_function.tf`

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

**Dependency check**: If `module "role"` is missing from `main.tf`, generate it using the dependency module templates from [resolver-workflow.md](resolver-workflow.md#dependency-modules--maintf). If `module "appsync"`, `module "cognito_user_pool"`, or `module "cognito_user_pool_client"` are also missing, generate them too — follow the full dependency chain.

## C) Cron Resources (cron type only)

Append after the module block:

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
