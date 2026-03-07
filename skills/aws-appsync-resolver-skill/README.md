# AWS AppSync Resolver Skill

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill for writing AWS AppSync JavaScript (APPSYNC_JS) resolvers. It teaches Claude how to generate correct, production-ready resolvers for all supported AppSync data sources.

## Supported Data Sources

- **DynamoDB** — CRUD, queries, scans, batch operations, pagination
- **HTTP** — REST APIs, API Gateway, SNS, AWS Translate
- **Lambda** — Synchronous invoke with full context forwarding
- **EventBridge** — PutEvents for event-driven architectures
- **OpenSearch** — Full-text search, geo queries, pagination
- **RDS** — Aurora PostgreSQL/MySQL via Data API with SQL builders
- **NONE** — Local operations, subscriptions, data transforms
- **Pipeline** — Chaining multiple resolver functions

## Installation

```bash
npx skills add https://github.com/ralphcrisostomo/aws-appsync-resolver-skill
```

## What's Included

| File | Description |
|------|-------------|
| `SKILL.md` | Core skill definition — resolver patterns, context object, imports, error handling |
| `references/dynamodb.md` | 15 DynamoDB patterns: get, put, update, delete, query, scan, batch ops |
| `references/http.md` | HTTP resolver patterns: REST calls, API Gateway, SNS, AWS Translate |
| `references/rds.md` | RDS/Aurora patterns: raw SQL, select builder, joins, subqueries, type hints |
| `references/opensearch.md` | OpenSearch patterns: term queries, geo distance, pagination |
| `references/lambda-eventbridge-none.md` | Lambda invoke, EventBridge PutEvents, local publish, subscription filters |
| `references/pipeline.md` | Pipeline resolvers: chaining functions, stash, auth + data fetch patterns |
| `evals/evals.json` | 3 evaluation prompts to test skill quality |

## Usage

Once installed, Claude Code automatically uses this skill when you ask about AppSync resolvers. Example prompts:

```
Write an AppSync resolver that creates a blog post in DynamoDB with an
auto-generated ID and createdAt timestamp.
```

```
I need a resolver that queries Aurora PostgreSQL to fetch customer orders
with a join on the products table, filtered by date range.
```

```
Set up a subscription resolver that filters alerts by severity and user group.
```

```
Create a pipeline resolver that checks authorization first, then fetches
data from DynamoDB.
```

## License

[MIT](LICENSE)
