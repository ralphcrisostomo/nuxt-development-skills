# RDS Resolvers (Aurora Data API)

RDS resolvers connect AppSync to Aurora PostgreSQL or MySQL databases via the Data API. The `@aws-appsync/utils/rds` module provides two approaches: the `sql` tagged template for raw SQL, and the `select`/`insert`/`update`/`remove` builders for structured queries.

## Table of Contents
1. [Raw SQL with Tagged Template](#raw-sql-with-tagged-template)
2. [Select with Join and Aggregation](#select-with-join-and-aggregation)
3. [Select with Date Range and Type Hints](#select-with-date-range-and-type-hints)
4. [Subqueries](#subqueries)
5. [Module Reference](#module-reference)

---

## Raw SQL with Tagged Template

The `sql` tagged template automatically parameterizes dynamic values to prevent SQL injection:

```js
import { util } from '@aws-appsync/utils';
import { sql, toJsonObject, createPgStatement as pg } from '@aws-appsync/utils/rds';

export function request(ctx) {
  return pg(sql`select count(*) from album where artist_id = ${ctx.args.artist_id}`);
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return toJsonObject(result)[0][0];
}
```

## Select with Join and Aggregation

The `select` builder constructs complex queries with joins, grouping, and having clauses:

```js
import { util } from '@aws-appsync/utils';
import { select, toJsonObject, createPgStatement as pg, agg } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const query = select({
    from: 'album',
    columns: ['name', { count: agg.count('*') }],
    join: [{ from: 'artist', using: ['artist_id'] }],
    groupBy: ['name'],
    having: {
      album_id: { count: { gt: 1 } },
    },
    orderBy: [{ column: 'name' }],
  });
  return pg(query);
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return toJsonObject(result)[0];
}
```

## Select with Date Range and Type Hints

Use `typeHint` for explicit type casting (timestamps, dates, UUIDs, etc.):

```js
import { util } from '@aws-appsync/utils';
import { select, toJsonObject, createPgStatement as pg, agg, typeHint as th } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const query = select({
    from: { i: 'invoice' },
    columns: [agg.count('i.invoice_id'), agg.sum('i.total')],
    where: {
      invoice_date: {
        between: [th.TIMESTAMP('2021-01-01 00:00:00'), th.TIMESTAMP('2022-12-31 23:59:59')],
      },
    },
  });
  return pg(query);
}

export function response(ctx) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return toJsonObject(result)[0];
}
```

## Subqueries

Nest a `select()` call inside the `from` property to use it as a subquery:

```js
import { select, createPgStatement as pg, agg } from '@aws-appsync/utils/rds';

export function request(ctx) {
  // Subquery: albums with multiple genres
  const sub = select({
    from: 'album',
    columns: [
      'album_id', 'title', 'artist_id',
      { tracks: agg.count('track_id') },
      { genres: agg.countDistinct('genre_id') },
    ],
    join: [{ from: 'track', using: ['album_id'] }],
    groupBy: [1], // ordinal position
    having: {
      genre_id: { countDistinct: { gt: 1 } },
    },
    orderBy: [{ column: 'genres', dir: 'desc' }],
  });

  // Outer query: join with artist
  return pg(
    select({
      from: { sub },
      columns: ['album_id', 'title', 'name'],
      join: [{ from: 'artist', using: ['artist_id'] }],
    }),
  );
}
```

## Module Reference

### Statement Creators

| Function | Purpose |
|----------|---------|
| `createPgStatement(query)` | Wrap query for PostgreSQL |
| `createMySQLStatement(query)` | Wrap query for MySQL |

### Query Builders

| Function | Purpose |
|----------|---------|
| `sql\`...\`` | Tagged template for raw SQL with auto-parameterization |
| `select({ from, columns, where, join, groupBy, having, orderBy, limit, offset })` | Build SELECT statements |
| `insert({ into, values, returning })` | Build INSERT statements |
| `update({ table, set, where, returning })` | Build UPDATE statements |
| `remove({ from, where, returning })` | Build DELETE statements |

### Utilities

| Function | Purpose |
|----------|---------|
| `toJsonObject(result)` | Convert RDS Data API result to JSON objects |

### Aggregation Functions (`agg`)

`agg.count(col)`, `agg.countDistinct(col)`, `agg.sum(col)`, `agg.avg(col)`, `agg.min(col)`, `agg.max(col)`

### Type Hints (`typeHint`)

| Hint | Format |
|------|--------|
| `typeHint.DATE(val)` | `YYYY-MM-DD` |
| `typeHint.DECIMAL(val)` | Decimal number |
| `typeHint.JSON(val)` | JSON string |
| `typeHint.TIME(val)` | `HH:MM:SS[.FFF]` |
| `typeHint.TIMESTAMP(val)` | `YYYY-MM-DD HH:MM:SS[.FFF]` |
| `typeHint.UUID(val)` | UUID string |

### Select Options

- **`from`**: Table name (string), aliased table (`{ alias: 'table' }`), or subquery (`{ alias: select({...}) }`)
- **`columns`**: Array of column names or aliased columns (`{ alias: expr }`)
- **`where`**: Condition object with operators: `eq`, `ne`, `lt`, `gt`, `le`, `ge`, `contains`, `beginsWith`, `between`
- **`join`**: Array of `{ from, using, on, type }` — type can be `'INNER'`, `'LEFT'`, `'RIGHT'`, `'FULL OUTER'`
- **`groupBy`**: Array of column names or ordinal positions
- **`having`**: Condition object (like `where` but for aggregated values)
- **`orderBy`**: Array of `{ column, dir }` where dir is `'asc'` or `'desc'`
- **`limit`** / **`offset`**: Pagination numbers
