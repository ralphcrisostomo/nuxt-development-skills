# OpenSearch Resolvers

OpenSearch resolvers connect AppSync to Amazon OpenSearch (formerly Elasticsearch) for full-text search, geo queries, and analytics.

## Table of Contents
1. [Simple Term Query](#simple-term-query)
2. [Get Document by ID](#get-document-by-id)
3. [Paginate Results](#paginate-results)
4. [Geo Distance Query](#geo-distance-query)

---

## Simple Term Query

Search documents by a field value:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const index = 'posts'; // replace with your index
  return {
    operation: 'GET',
    path: `/${index}/_search`,
    params: {
      body: {
        from: 0,
        size: 50,
        query: {
          term: {
            status: ctx.args.status, // replace with your field
          },
        },
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.hits.hits.map((hit) => hit._source);
}
```

## Get Document by ID

Retrieve a single document by its ID:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const index = 'posts'; // replace with your index
  return {
    operation: 'GET',
    path: `/${index}/_doc/${ctx.args.id}`,
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result['_source'];
}
```

## Paginate Results

Use `from` and `size` for fixed-page pagination:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const index = 'posts'; // replace with your index
  return {
    operation: 'GET',
    path: `/${index}/_search`,
    params: {
      body: {
        from: ctx.args.from ?? 0,
        size: ctx.args.size ?? 50,
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.hits.hits.map((hit) => hit._source);
}
```

## Geo Distance Query

Find all documents within a radius of a geographic point:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const index = 'locations'; // replace with your index
  return {
    operation: 'GET',
    path: `/${index}/_search`,
    params: {
      body: {
        query: {
          filtered: {
            query: { match_all: {} },
            filter: {
              geo_distance: {
                distance: '20mi',
                location: { lat: 47.6205, lon: 122.3493 },
              },
            },
          },
        },
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.hits.hits.map((hit) => hit._source);
}
```

## OpenSearch Request Structure

All OpenSearch resolvers return an object with:

| Field | Description |
|-------|-------------|
| `operation` | `'GET'`, `'POST'`, `'PUT'`, `'DELETE'` |
| `path` | OpenSearch API path (e.g., `/index/_search`, `/index/_doc/id`) |
| `params.body` | The OpenSearch query body |

## Response Pattern

OpenSearch search results are nested under `ctx.result.hits.hits`. Each hit has `_source` containing the document:

```js
ctx.result.hits.hits.map((hit) => hit._source);
```

For single document retrieval, use `ctx.result['_source']`.
