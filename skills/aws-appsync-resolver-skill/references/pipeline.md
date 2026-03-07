# Pipeline Resolvers

Pipeline resolvers chain multiple functions together. Each function in the pipeline runs sequentially, and the result of one function is available to the next via `ctx.prev.result`.

## Pipeline Resolver Structure

A pipeline resolver has:
1. A **before** handler (the resolver's `request` function)
2. One or more **functions** (each with their own `request`/`response`)
3. An **after** handler (the resolver's `response` function)

## Default Pipeline Resolver

The resolver itself typically just triggers the pipeline and forwards the final result:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {};
}

export const response = (ctx) => ctx.prev.result;
```

The actual data source work happens in the individual pipeline functions.

## How Data Flows

```
request(ctx) → Function 1 → Function 2 → ... → Function N → response(ctx)
```

- The resolver's `request` can set up `ctx.stash` — a shared object all functions can read/write
- Each function's `response` result becomes the next function's `ctx.prev.result`
- The resolver's `response` receives the last function's result via `ctx.prev.result`

## Using ctx.stash

Share data between pipeline functions:

```js
// Resolver request — set up shared state
export function request(ctx) {
  ctx.stash.userId = ctx.args.userId;
  return {};
}

// Function 1 — read from stash
export function request(ctx) {
  const userId = ctx.stash.userId;
  return ddb.get({ key: { id: userId } });
}
```

## Example: Auth Check + Data Fetch Pipeline

**Function 1: Verify authorization**
```js
export function request(ctx) {
  return {}; // NONE data source — just check auth
}

export function response(ctx) {
  const user = ctx.identity;
  if (!user.groups?.includes('admin')) {
    util.unauthorized();
  }
  return ctx.prev.result;
}
```

**Function 2: Fetch from DynamoDB**
```js
import * as ddb from '@aws-appsync/utils/dynamodb';

export const request = (ctx) => ddb.get({ key: { id: ctx.args.id } });
export const response = (ctx) => ctx.result;
```

**Pipeline resolver:**
```js
export function request(ctx) {
  return {};
}

export const response = (ctx) => ctx.prev.result;
```
