# DynamoDB Resolvers

## Table of Contents
1. [Get Item](#get-item)
2. [Put Item (Create)](#put-item-create)
3. [Update Item](#update-item)
4. [Delete Item](#delete-item)
5. [List Items (Scan)](#list-items-scan)
6. [Simple Query](#simple-query)
7. [Query with Pagination](#query-with-pagination)
8. [Query with Filter on Index](#query-with-filter-on-index)
9. [Query with Contains Expression](#query-with-contains-expression)
10. [Query Items Created Today](#query-items-created-today)
11. [Query with Greater-Than](#query-with-greater-than)
12. [Increment Counter on Update](#increment-counter-on-update)
13. [Batch Get Items](#batch-get-items)
14. [Batch Put Items](#batch-put-items)
15. [Batch Delete Items](#batch-delete-items)

---

## Get Item

```js
import * as ddb from '@aws-appsync/utils/dynamodb';

export const request = (ctx) => ddb.get({ key: { id: ctx.args.id } });
export const response = (ctx) => ctx.result;
```

## Put Item (Create)

Auto-generates an ID and ensures the item doesn't already exist:

```js
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const key = { id: util.autoId() };
  const item = ctx.args.input;
  const condition = { id: { attributeExists: false } };
  return ddb.put({ key, item, condition });
}

export const response = (ctx) => ctx.result;
```

## Update Item

Extracts the ID from input, updates remaining fields, and verifies the item exists:

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const { id, ...values } = ctx.args.input;
  const condition = { id: { attributeExists: true } };
  return ddb.update({ key: { id }, update: values, condition });
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type);
  }
  return result;
}
```

## Delete Item

```js
import * as ddb from '@aws-appsync/utils/dynamodb';

export const request = (ctx) => ddb.remove({ key: { id: ctx.args.id } });
export const response = (ctx) => ctx.result;
```

## List Items (Scan)

Paginated scan with configurable limit:

```js
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const { limit = 10, nextToken } = ctx.args;
  return ddb.scan({ limit, nextToken });
}

export function response(ctx) {
  const { items, nextToken } = ctx.result;
  return { items: items ?? [], nextToken };
}
```

## Simple Query

Query by partition key:

```js
import * as ddb from '@aws-appsync/utils/dynamodb';

export const request = (ctx) => ddb.query({ query: { id: { eq: ctx.args.id } } });
export const response = (ctx) => ctx.result.items;
```

## Query with Pagination

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const { id, limit = 20, nextToken } = ctx.args;
  return ddb.query({ query: { id: { eq: id } }, limit, nextToken });
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
}
```

## Query with Filter on Index

Query a secondary index with an additional filter:

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  return ddb.query({
    index: 'name-index',
    query: { name: { eq: ctx.args.name } },
    filter: { city: { contains: ctx.args.city } },
  });
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
}
```

## Query with Contains Expression

Filter results where a list attribute contains a value:

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  return ddb.query({
    query: { id: { eq: ctx.args.id } },
    filter: { tags: { contains: ctx.args.tag } },
  });
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
}
```

## Query Items Created Today

Uses `util.time.nowISO8601()` to filter by today's date:

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const today = util.time.nowISO8601().substring(0, 10);
  return ddb.query({
    query: { id: { eq: ctx.args.id }, createdAt: { beginsWith: today } },
  });
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
}
```

## Query with Greater-Than

Filter by sort key comparison:

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const { id, createdAt } = ctx.args;
  return ddb.query({ query: { id: { eq: id } }, createdAt: { gt: createdAt } });
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.items;
}
```

## Increment Counter on Update

Use `ddb.operations.increment()` to atomically increment a field:

```js
import { util } from '@aws-appsync/utils';
import * as ddb from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const { id, ...values } = ctx.args.input;
  values.version = ddb.operations.increment(1);
  const condition = { id: { attributeExists: true } };
  return ddb.update({ key: { id }, update: values, condition });
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.error(error.message, error.type);
  }
  return result;
}
```

## Batch Get Items

Retrieve multiple items by keys using `BatchGetItem`:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'BatchGetItem',
    tables: {
      Posts: {
        keys: ctx.args.ids.map((id) => util.dynamodb.toMapValues({ id })),
        consistentRead: true,
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.data.Posts;
}
```

## Batch Put Items

Insert multiple items using `BatchPutItem`:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'BatchPutItem',
    tables: {
      Posts: ctx.args.posts.map((post) => util.dynamodb.toMapValues(post)),
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.data.Posts;
}
```

## Batch Delete Items

Delete multiple items by keys using `BatchDeleteItem`:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'BatchDeleteItem',
    tables: {
      Posts: {
        keys: ctx.args.ids.map((id) => util.dynamodb.toMapValues({ id })),
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.data.Posts;
}
```

## DynamoDB Helper Reference

### High-level helpers (`@aws-appsync/utils/dynamodb`)

| Function | Purpose |
|----------|---------|
| `ddb.get({ key })` | Get a single item |
| `ddb.put({ key, item, condition })` | Create/overwrite an item |
| `ddb.update({ key, update, condition })` | Update specific attributes |
| `ddb.remove({ key })` | Delete an item |
| `ddb.scan({ limit, nextToken })` | Scan table with pagination |
| `ddb.query({ query, index, filter, limit, nextToken })` | Query by key conditions |
| `ddb.operations.increment(n)` | Atomic increment expression |

### Query condition operators

`eq`, `ne`, `lt`, `le`, `gt`, `ge`, `beginsWith`, `between`, `contains`, `attributeExists`

### Condition expressions

Used in `put`/`update`/`remove` to enforce constraints:
```js
{ id: { attributeExists: false } }  // Item must NOT exist (create-only)
{ id: { attributeExists: true } }   // Item MUST exist (update-only)
```
