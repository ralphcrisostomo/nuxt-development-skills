# Init Templates

All `.tpl` files use `{{PLACEHOLDER}}` syntax. Replace before writing.

## Config & Schema

| File | Target Path | Source |
|---|---|---|
| `terraform-scaffold.config.ts` | `<root>/terraform-scaffold.config.ts` | [templates/init/terraform-scaffold.config.ts.tpl](../templates/init/terraform-scaffold.config.ts.tpl) |
| `schema.graphql` | `terraform/envs/staging/schema.graphql` | [templates/init/schema.graphql.tpl](../templates/init/schema.graphql.tpl) |

## Staging Environment

Files placed in `terraform/envs/staging/`.

| File | Placeholders | Source |
|---|---|---|
| `backend.hcl` | `STATE_BUCKET`, `PROJECT_KEBAB`, `AWS_REGION`, `LOCK_TABLE` | [templates/init/envs/staging/backend.hcl.tpl](../templates/init/envs/staging/backend.hcl.tpl) |
| `main.tf` | None | [templates/init/envs/staging/main.tf.tpl](../templates/init/envs/staging/main.tf.tpl) |
| `outputs.tf` | None | [templates/init/envs/staging/outputs.tf.tpl](../templates/init/envs/staging/outputs.tf.tpl) |
| `variables.tf` | None | [templates/init/envs/staging/variables.tf.tpl](../templates/init/envs/staging/variables.tf.tpl) |
| `ses.tf` | None | [templates/init/envs/staging/ses.tf.tpl](../templates/init/envs/staging/ses.tf.tpl) |
| `versions.tf` | None | [templates/init/envs/staging/versions.tf.tpl](../templates/init/envs/staging/versions.tf.tpl) |
| `terraform.tfvars.example` | `FUNCTION_PREFIX`, `PROJECT_KEBAB`, `AWS_REGION` | [templates/init/envs/staging/terraform.tfvars.example.tpl](../templates/init/envs/staging/terraform.tfvars.example.tpl) |

## Production Environment

Files placed in `terraform/envs/production/`.

| File | Placeholders | Source |
|---|---|---|
| `backend.hcl` | `STATE_BUCKET`, `PROJECT_KEBAB`, `AWS_REGION`, `LOCK_TABLE` | [templates/init/envs/production/backend.hcl.tpl](../templates/init/envs/production/backend.hcl.tpl) |
| `main.tf` | None | [templates/init/envs/production/main.tf.tpl](../templates/init/envs/production/main.tf.tpl) |
| `outputs.tf` | None | [templates/init/envs/production/outputs.tf.tpl](../templates/init/envs/production/outputs.tf.tpl) |
| `variables.tf` | `AWS_REGION` | [templates/init/envs/production/variables.tf.tpl](../templates/init/envs/production/variables.tf.tpl) |
| `ses.tf` | None | [templates/init/envs/production/ses.tf.tpl](../templates/init/envs/production/ses.tf.tpl) |
| `versions.tf` | None | [templates/init/envs/production/versions.tf.tpl](../templates/init/envs/production/versions.tf.tpl) |
| `terraform.tfvars.example` | `PROJECT_KEBAB`, `AWS_REGION` | [templates/init/envs/production/terraform.tfvars.example.tpl](../templates/init/envs/production/terraform.tfvars.example.tpl) |

## Lambda Config

| File | Target Path | Source |
|---|---|---|
| `tsconfig.json` | `terraform/lambda/tsconfig.json` | [templates/init/lambda/tsconfig.json](../templates/init/lambda/tsconfig.json) |
