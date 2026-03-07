# HTTP Resolvers

HTTP resolvers connect AppSync to REST APIs, API Gateway endpoints, and AWS service APIs (SNS, Translate, etc.). The HTTP data source must be configured in AppSync with the target endpoint.

## Table of Contents
1. [Forward Request](#forward-request)
2. [GET to API Gateway](#get-to-api-gateway)
3. [POST to API Gateway](#post-to-api-gateway)
4. [Publish to SNS](#publish-to-sns)
5. [AWS Translate](#aws-translate)
6. [Reusable Fetch Helper](#reusable-fetch-helper)

---

## Forward Request

Forward an incoming GraphQL request as an HTTP request, passing path, body, and query from args:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return fetch(ctx.args.path, {
    body: ctx.args.body,
    query: ctx.args.query,
  });
}

export function response(ctx) {
  const { statusCode, body } = ctx.result;
  if (statusCode === 200) {
    return body;
  }
  util.appendError(body, statusCode);
}

function fetch(resourcePath, options) {
  const { method = 'GET', headers, body: _body, query = {} } = options;
  const [path, params] = resourcePath.split('?');
  if (params && params.length) {
    params.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      query[key] = value;
    });
  }
  const body = typeof _body === 'object' ? JSON.stringify(_body) : _body;
  return {
    resourcePath: path,
    method,
    params: { headers, query, body },
  };
}
```

## GET to API Gateway

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return fetch(`/v1/users/${ctx.args.id}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function response(ctx) {
  const { statusCode, body } = ctx.result;
  if (statusCode === 200) {
    return body;
  }
  util.appendError(body, statusCode);
}

function fetch(resourcePath, options) {
  const { method = 'GET', headers, body: _body, query } = options;
  const body = typeof _body === 'object' ? JSON.stringify(_body) : _body;
  return {
    resourcePath,
    method,
    params: { headers, query, body },
  };
}
```

## POST to API Gateway

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return fetch('/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: ctx.args.input,
  });
}

export function response(ctx) {
  const { statusCode, body } = ctx.result;
  if (statusCode === 200) {
    return body;
  }
  util.appendError(body, statusCode);
}

function fetch(resourcePath, options) {
  const { method = 'GET', headers, body: _body, query } = options;
  const body = typeof _body === 'object' ? JSON.stringify(_body) : _body;
  return {
    resourcePath,
    method,
    params: { headers, query, body },
  };
}
```

## Publish to SNS

Publish a message to an SNS topic via the AWS SNS HTTP API:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const TOPIC_ARN = '<your:topic:arn>';
  const { input: values } = ctx.args;
  return publishToSNSRequest(TOPIC_ARN, values);
}

export function response(ctx) {
  const { result: { statusCode, body } } = ctx;
  if (statusCode === 200) {
    return util.xml.toMap(body).PublishResponse.PublishResult;
  }
  util.appendError(body, `${statusCode}`);
}

function publishToSNSRequest(topicArn, values) {
  const arn = util.urlEncode(topicArn);
  const message = util.urlEncode(JSON.stringify(values));
  const Body = {
    Action: 'Publish',
    Version: '2010-03-31',
    topicArn: arn,
    Message: message,
  };
  const body = Object.entries(Body)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return fetch('/', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
}

function fetch(resourcePath, options) {
  const { method = 'GET', headers, body: _body, query } = options;
  const body = typeof _body === 'object' ? JSON.stringify(_body) : _body;
  return { resourcePath, method, params: { headers, query, body } };
}
```

## AWS Translate

Call the AWS Translate service to translate text:

```js
import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { text = 'Hello World!', sourceLanguageCode = 'EN', targetLanguageCode = 'FR' } = ctx.args;
  return awsTranslateRequest(text, sourceLanguageCode, targetLanguageCode);
}

export function response(ctx) {
  const { statusCode, body } = ctx.result;
  if (statusCode === 200) {
    return JSON.parse(body).TranslatedText;
  }
  util.appendError(body, `${statusCode}`);
}

function awsTranslateRequest(text, sourceLanguageCode, targetLanguageCode) {
  return fetch('/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSShinefrontService_20170701.TranslateText',
    },
    body: { SourceLanguageCode: sourceLanguageCode, TargetLanguageCode: targetLanguageCode, Text: text },
  });
}

function fetch(resourcePath, options) {
  const { method = 'GET', headers, body: _body, query } = options;
  const body = typeof _body === 'object' ? JSON.stringify(_body) : _body;
  return { resourcePath, method, params: { headers, query, body } };
}
```

## Reusable Fetch Helper

All HTTP resolvers use this pattern. The `fetch` helper builds the HTTP request object AppSync expects:

```js
/**
 * @param {string} resourcePath - URL path
 * @param {Object} options
 * @param {'PUT'|'POST'|'GET'|'DELETE'|'PATCH'} [options.method='GET']
 * @param {Object.<string,string>} [options.headers]
 * @param {string|Object} [options.body]
 * @param {Object.<string,string>} [options.query]
 * @returns {import('@aws-appsync/utils').HTTPRequest}
 */
function fetch(resourcePath, options) {
  const { method = 'GET', headers, body: _body, query } = options;
  const body = typeof _body === 'object' ? JSON.stringify(_body) : _body;
  return {
    resourcePath,
    method,
    params: { headers, query, body },
  };
}
```

## HTTP Response Pattern

Always check `statusCode` — the HTTP data source returns the raw HTTP response:

```js
export function response(ctx) {
  const { statusCode, body } = ctx.result;
  if (statusCode === 200) {
    return body; // or JSON.parse(body) for non-JSON responses
  }
  util.appendError(body, statusCode);
}
```

- Use `util.appendError()` for soft errors (returns partial data + error)
- Use `util.error()` for hard errors (stops execution)
- For XML responses (e.g., SNS), use `util.xml.toMap(body)` to parse
