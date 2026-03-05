# AppSync Pipeline Functions

Static JS files placed in `terraform/functions/` during init. Copy as-is from the template sources.

| File | Description | Source |
|---|---|---|
| `base.js` | Hash validation pipeline function — first step in every pipeline resolver. Compares `x-hbm-hash` header against djb2 hash of args. | [templates/init/functions/base.js](../templates/init/functions/base.js) |
| `invoke.js` | Lambda invoke resolver — forwards context to Lambda datasource via `Invoke` operation. | [templates/init/functions/invoke.js](../templates/init/functions/invoke.js) |
| `none.js` | NONE datasource resolver — returns `{ userId }` from args for child resolvers. | [templates/init/functions/none.js](../templates/init/functions/none.js) |
