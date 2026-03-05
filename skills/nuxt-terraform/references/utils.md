# Utility Files

Static files placed in `utils/` during init. Copy as-is from the template source.

| File | Description | Source |
|---|---|---|
| `hash.ts` | djb2 hash function — truncates input to 1000 chars, returns string hash. Used by `useGraphql` for request signing. | [templates/init/utils/hash.ts](../templates/init/utils/hash.ts) |
