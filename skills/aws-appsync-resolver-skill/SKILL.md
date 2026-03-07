---
name: aws-appsync-resolver
description: >
  Write AWS AppSync JavaScript (APPSYNC_JS) resolvers for GraphQL APIs. Use this skill whenever the user
  needs to create, modify, or debug AppSync resolvers, write request/response handler functions for
  DynamoDB, HTTP, Lambda, EventBridge, OpenSearch, RDS, or NONE data sources, or set up pipeline
  resolvers. Trigger this skill when the user mentions AppSync resolvers, GraphQL resolvers on AWS,
  APPSYNC_JS runtime, or asks about connecting GraphQL to AWS data sources — even if they don't
  explicitly say "AppSync".
model: opus
---

# AWS AppSync JavaScript Resolver Skill

Write resolvers using the AppSync JavaScript (APPSYNC_JS) runtime. Resolvers connect GraphQL operations to data sources using familiar JavaScript syntax.

## Core Pattern

Every resolver exports a `request` function and a `response` function:

```js
export function request(ctx) {
    // Build the data source request using ctx.args, ctx.identity, ctx.source, etc.
    return { /* data source request */ };
}

export function response(ctx) {
    // Transform and return the data source response
    return ctx.result;
}
```

The `ctx` (context) object provides:
- `ctx.args` — GraphQL field arguments
- `ctx.result` — the data source response (in `response` handler)
- `ctx.error` — error from the data source, if any
- `ctx.identity` — caller identity (Cognito, IAM, etc.)
- `ctx.source` — parent field value (for nested resolvers)
- `ctx.info` — field name, parent type, selection set
- `ctx.prev.result` — result from previous function (pipeline resolvers)
- `ctx.stash` — shared object across pipeline functions
- `ctx.request` — request headers

## Imports

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';
import { sql, select, insert, update, remove, createPgStatement, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';
```

Only import what you need. The `@aws-appsync/utils/dynamodb` module provides high-level helpers. The `@aws-appsync/utils/rds` module provides SQL builders.

## Choosing the Right Data Source

| Data Source | When to Use |
|-------------|-------------|
| **DynamoDB** | NoSQL key-value/document storage — most common |
| **HTTP** | REST APIs, API Gateway, or AWS service APIs (SNS, Translate, etc.) |
| **Lambda** | Complex business logic that can't run in APPSYNC_JS |
| **RDS** | Aurora PostgreSQL/MySQL via Data API |
| **OpenSearch** | Full-text search, geo queries, analytics |
| **EventBridge** | Event-driven architectures, publish events |
| **NONE** | Local operations — subscriptions, transforms, no external call |

Read the relevant reference file below for the data source patterns.

## Reference Files

Each data source has a dedicated reference with complete code examples. Read the one you need:

- `references/dynamodb.md` — DynamoDB CRUD, queries, batch operations, scans, pagination
- `references/http.md` — HTTP requests, API Gateway, SNS, AWS Translate
- `references/rds.md` — Aurora PostgreSQL/MySQL with the `select`/`sql` builders
- `references/opensearch.md` — Full-text search, geo, pagination
- `references/lambda-eventbridge-none.md` — Lambda invoke, EventBridge PutEvents, local publish, enhanced subscriptions
- `references/pipeline.md` — Pipeline resolvers (chaining multiple functions)

## APPSYNC_JS Runtime Restrictions

The APPSYNC_JS runtime does NOT support:
- **`for` / `while` / `do...while` loops** — use `.forEach()`, `.map()`, `.filter()`, `.reduce()` instead
- **`Array.sort()`** — not available; implement merge logic via `.forEach()` on concatenated arrays
- **Arrow functions in array method callbacks** — can cause `ReferenceError` for callback parameters. Always use **traditional function expressions**:
  ```js
  // WRONG — arrow function parameter may be undefined at runtime
  items.forEach((item) => { doSomething(item) })

  // CORRECT — traditional function expression
  items.forEach(function (item) { doSomething(item) })
  ```
- **`try` / `catch` / `finally`** — use `ctx.error` checks instead
- **`async` / `await`** — not supported
- **Classes, generators, symbols, WeakRef, `eval`**
- **`returnValues` in UpdateItem** — not supported; error: `Unsupported element '$[returnValues]'`. `ctx.result` after `UpdateItem` is empty (no updated attributes). Use optimistic counts on the frontend, or add a follow-up `GetItem` pipeline function to read the updated value

## Error Handling

Two patterns depending on severity:

```js
// Hard error — stops execution and returns error to client
if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
}

// Soft error — appends error but still returns data
util.appendError(body, statusCode);
```

## Common Utilities

```js
util.autoId()                          // Generate a unique ID
util.time.nowISO8601()                 // Current timestamp
util.dynamodb.toMapValues({ id })      // Convert JS object to DynamoDB attribute map
util.transform.toSubscriptionFilter()  // Build subscription filters
util.xml.toMap(body)                   // Parse XML to object
util.urlEncode(str)                    // URL-encode a string
util.http.copyHeaders(ctx.request.headers) // Copy request headers
```

## Development Setup

Install the AppSync utilities for type checking and editor support:

```bash
npm install @aws-appsync/utils @aws-appsync/eslint-plugin
```

Use JSDoc type annotations for better IDE support:

```js
/** @param {import('@aws-appsync/utils').Context<{id: string}>} ctx */
export function request(ctx) { ... }
```
