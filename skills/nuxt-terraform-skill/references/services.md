# Service Files

Static files placed in `services/` during init. Copy as-is from the template sources.

| File | Description | Source |
|---|---|---|
| `cognitoService.ts` | AWS Cognito auth — sign in/up, confirm, forgot password, refresh tokens, admin get user. Wraps `@aws-sdk/client-cognito-identity-provider`. | [templates/init/services/cognitoService.ts](../templates/init/services/cognitoService.ts) |
| `dynamodbService.ts` | DynamoDB CRUD — get, query, put, update, delete, bulk put, scan. Wraps `@aws-sdk/lib-dynamodb` with singleton client. | [templates/init/services/dynamodbService.ts](../templates/init/services/dynamodbService.ts) |
| `s3Service.ts` | S3 uploads — `putObject` and `buildS3Key` helper. Wraps `@aws-sdk/client-s3`. | [templates/init/services/s3Service.ts](../templates/init/services/s3Service.ts) |
| `sesService.ts` | SES email — MIME message builder with S3 attachment support. Wraps `@aws-sdk/client-ses` + `mimetext`. | [templates/init/services/sesService.ts](../templates/init/services/sesService.ts) |
| `netsuiteService.ts` | NetSuite REST client — OAuth 1.0 HMAC-SHA256 signed requests. | [templates/init/services/netsuiteService.ts](../templates/init/services/netsuiteService.ts) |
| `textractService.ts` | AWS Textract — document analysis (forms + tables) returning extracted text lines. | [templates/init/services/textractService.ts](../templates/init/services/textractService.ts) |
