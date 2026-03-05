# Composable Files

Static files placed in `app/composables/` during init. Copy as-is from the template sources.

| File | Description | Source |
|---|---|---|
| `useAuthState.ts` | Reactive auth state with role-based cookies, `signIn`/`signOut` helpers | [templates/init/composables/useAuthState.ts](../templates/init/composables/useAuthState.ts) |
| `useCognitoAuth.ts` | Full Cognito auth flow — sign in/up, confirm, forgot password, token refresh, session cookies | [templates/init/composables/useCognitoAuth.ts](../templates/init/composables/useCognitoAuth.ts) |
| `useGraphql.ts` | AppSync GraphQL client — `useGraphql` (SSR-safe via `useFetch`) and `graphqlMutate` (direct `$fetch`) with djb2 hash header | [templates/init/composables/useGraphql.ts](../templates/init/composables/useGraphql.ts) |
