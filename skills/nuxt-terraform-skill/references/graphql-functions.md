# GraphQL Resolver Function Templates

Per-resolver AppSync JS functions placed in `terraform/functions/<name>.js`.
Used only for `APPSYNC_JS` runtime.

## Template Index

| Operation | Placeholders | Description | Source |
|---|---|---|---|
| `GetItem` | `{{FIELD}}` — key field name (e.g. `id`) | Single-item lookup by primary key | [templates/graphql/functions/GetItem.js.tpl](../templates/graphql/functions/GetItem.js.tpl) |
| `Query` | `{{FIELD}}` — partition key, `{{INDEX}}` — GSI name (`by<Field>`) | GSI query returning list of items | [templates/graphql/functions/Query.js.tpl](../templates/graphql/functions/Query.js.tpl) |
| `PutItem` | None | Create item with auto-generated `id`, `createdAt`, `updatedAt` | [templates/graphql/functions/PutItem.js.tpl](../templates/graphql/functions/PutItem.js.tpl) |
| `UpdateItem` | None | Update item fields with automatic `updatedAt` | [templates/graphql/functions/UpdateItem.js.tpl](../templates/graphql/functions/UpdateItem.js.tpl) |
| `Scan` | None | Full table scan with optional filter expression | [templates/graphql/functions/Scan.js.tpl](../templates/graphql/functions/Scan.js.tpl) |
| `BatchDeleteItem` | None | Batch delete by `userId` + `id` pairs | [templates/graphql/functions/BatchDeleteItem.js.tpl](../templates/graphql/functions/BatchDeleteItem.js.tpl) |

## Placeholder Reference

- `{{FIELD}}` — Replace with the key field name (e.g. `id`, `userId`). Used in GetItem key and Query expression.
- `{{INDEX}}` — Replace with the GSI name, typically `by<Field>` (e.g. `byUserId`). Used in Query only.
