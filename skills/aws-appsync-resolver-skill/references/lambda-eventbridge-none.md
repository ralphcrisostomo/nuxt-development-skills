# Lambda, EventBridge, and NONE Resolvers

## Table of Contents
1. [Lambda Invoke](#lambda-invoke)
2. [EventBridge PutEvents](#eventbridge-putevents)
3. [NONE — Local Publish](#none--local-publish)
4. [NONE — Enhanced Subscription](#none--enhanced-subscription)

---

## Lambda Invoke

Pass contextual information to a Lambda function and return its result:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const payload = {
    arguments: ctx.arguments,
    identity: ctx.identity,
    source: ctx.source,
    request: ctx.request,
    info: {
      fieldName: ctx.info.fieldName,
      parentTypeName: ctx.info.parentTypeName,
      variables: ctx.info.variables,
      selectionSetList: ctx.info.selectionSetList,
      selectionSetGraphQL: ctx.info.selectionSetGraphQL,
    },
  };
  return { operation: 'Invoke', payload };
}

export function response(ctx) {
  const { result, error } = ctx;
  if (error) {
    util.error(error.message, error.type, result);
  }
  return result;
}
```

The Lambda function receives the payload and can use `arguments`, `identity`, `source`, and `info` to determine what to return. The `selectionSetList` and `selectionSetGraphQL` are useful for optimizing what data the Lambda fetches.

### Lambda Request Structure

| Field | Value |
|-------|-------|
| `operation` | `'Invoke'` (synchronous) or `'BatchInvoke'` (batch) |
| `payload` | Any JSON-serializable object passed to the Lambda |

---

## EventBridge PutEvents

Publish events to an EventBridge event bus:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'PutEvents',
    events: [
      {
        source: ctx.source,
        detail: {
          key1: [1, 2, 3, 4],
          key2: 'strval',
        },
        detailType: 'sampleDetailType',
        resources: ['Resource1', 'Resource2'],
        time: util.time.nowISO8601(),
      },
    ],
  };
}

export function response(ctx) {
  return ctx.result;
}
```

### EventBridge Request Structure

| Field | Description |
|-------|-------------|
| `operation` | Always `'PutEvents'` |
| `events` | Array of event objects |
| `events[].source` | Event source identifier |
| `events[].detail` | Event payload (any JSON) |
| `events[].detailType` | Event type description |
| `events[].resources` | Related resource ARNs |
| `events[].time` | ISO 8601 timestamp |

---

## NONE — Local Publish

The NONE data source doesn't call any external service. Use it for local operations like publishing to subscriptions or transforming data:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    payload: {
      body: ctx.args.body,
      to: ctx.args.to,
      from: /** @type {import('@aws-appsync/utils').AppSyncIdentityCognito} */ (ctx.identity).username,
      sentAt: util.time.nowISO8601(),
    },
  };
}

export function response(ctx) {
  return ctx.result;
}
```

The payload is passed directly to the response handler — no network call is made. This is commonly used with GraphQL subscriptions to broadcast messages to connected clients.

### NONE Request Structure

| Field | Description |
|-------|-------------|
| `payload` | Any JSON object — becomes `ctx.result` in the response handler |

---

## NONE — Enhanced Subscription

Set up filtered subscriptions with `extensions.setSubscriptionFilter()`:

```js
import { util, extensions } from '@aws-appsync/utils';

export function request(ctx) {
  return { payload: {} };
}

export function response(ctx) {
  const groups = ['admin', 'operators'];
  // Or use the user's own groups:
  // const groups = ctx.identity.groups;

  const filter = util.transform.toSubscriptionFilter({
    or: [
      { and: [{ severity: { ge: 7 } }, { priority: { in: ['high', 'medium'] } }] },
      { and: [{ classification: { eq: 'security' } }, { group: { in: groups } }] },
    ],
  });

  extensions.setSubscriptionFilter(filter);
  return null;
}
```

This creates a subscription that only triggers when:
- A mutation has severity >= 7 AND priority is "high" or "medium", OR
- A mutation has classification "security" AND the user is in "admin" or "operators" group

### Subscription Filter Operators

`eq`, `ne`, `lt`, `le`, `gt`, `ge`, `contains`, `notContains`, `beginsWith`, `in`, `between`

Combine with `and`/`or` for complex logic.
