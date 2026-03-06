---
name: ralph-verify-acceptance-criteria
description: "Verify Ralph user story implementations against acceptance criteria in prd.json. Use this skill whenever you need to verify a completed user story, test Ralph's implementation, check if acceptance criteria pass, validate admin dashboard features, or audit PRD completion status. Triggers on: verify story, check implementation, ralph verify, test acceptance criteria, validate prd, check user story, verify US-XXX, audit ralph progress, does this story pass."
model: opus, gpt-5.1-codex-max
---

# Ralph Verify Acceptance Criteria Skill

Verify that a user story implementation satisfies every acceptance criterion in `scripts/ralph/prd.json`. Produces a structured pass/fail report and optionally updates the PRD.

## When to Use

- After Ralph completes a user story — verify before marking `passes: true`
- When the user asks to audit or re-verify existing implementations
- To check if a specific acceptance criterion is met
- To generate a verification report across all stories

## Workflow

### 1. Load the PRD

Read `scripts/ralph/prd.json` from the project root. Parse the `userStories` array.

If the user specifies a story ID (e.g., "verify US-005"), target that story. If no story is specified, find the highest-priority story where `passes: true` that hasn't been verified yet, or ask the user which story to verify.

### 2. Classify Each Acceptance Criterion

For each acceptance criterion in the target story, determine the verification strategy:

| Pattern in criterion | Strategy | Tool |
|---|---|---|
| "Create file", "Add file" | **File exists** | Glob/Read |
| "middleware", "composable", "component", "page", "layout" | **File exists + content check** | Read + Grep |
| "Typecheck passes" | **Typecheck** | `bun run lint` via Bash |
| "tf:plan", "terraform", "Terraform module" | **Terraform plan** | `/nuxt-terraform` skill knowledge, `bun run tf:plan:staging` |
| "Verify in browser", "dev-browser" | **Visual verification** | `/dev-browser` skill |
| "GraphQL schema", "Add query", "Add mutation", "Add type" | **Schema check** | Grep on `schema.graphql` |
| "resolver", "function module", "pipeline resolver" | **Terraform config check** | Grep on `main.tf` and `terraform/functions/` |
| "Wire up", "datasource" | **Terraform wiring** | Grep on `main.tf` |
| "UCard", "UButton", "UBadge", "USkeleton" etc. | **Component usage** | Grep in target Vue file |
| General behavior descriptions | **Code review** | Read the relevant file and verify logic |

### 3. Execute Verifications

Run checks in this order (fail-fast on critical checks):

#### A. File Existence Checks
For criteria mentioning file creation, use Glob to confirm files exist. Read key files to verify they contain expected patterns (component names, function signatures, imports).

#### B. Code Content Checks
For behavioral criteria, Read the relevant source files and verify:
- Expected functions/methods exist
- Required imports or composable calls are present
- Correct patterns are used (e.g., `definePageMeta({ layout: 'admin', middleware: ['admin'] })`)
- GraphQL query strings are defined
- Resolver functions contain expected DynamoDB operations

#### C. GraphQL Schema Checks
For schema-related criteria, Grep `terraform/envs/staging/schema.graphql` for:
- Type definitions (`type AdminStats`)
- Query/mutation declarations (`getAdminStats`, `adminDeleteUser`)
- Field definitions with correct types
- Input arguments

#### D. Terraform Infrastructure Checks
For infrastructure criteria:
- Grep `terraform/envs/staging/main.tf` for module declarations
- Grep `terraform/envs/staging/lambda_function.tf` for Lambda resources
- Check `terraform/functions/` for resolver JS files
- Check `terraform/lambda/src/` for Lambda handler code
- If the user wants a full terraform validation, run `bun run tf:plan:staging` (requires AWS credentials)

#### E. TypeScript / Lint Check
For "Typecheck passes" criteria, run:
```bash
bun run lint 2>&1 | tail -20
```
Check exit code. If it fails, capture and report the errors.

#### F. Visual Verification (UI Stories)
For criteria mentioning "Verify in browser" or visual elements, use the `/dev-browser` skill:

1. Start the dev server if not running: `bun run dev &`
2. Start the browser: `./skills/dev-browser/server.sh &`
3. Navigate to the relevant admin page
4. For admin pages, use demo account auth (credentials in `.env` as `DEV_DEMO_EMAIL` / `DEV_DEMO_PASSWORD`) since dev-bypass doesn't support admin role
5. Take screenshots and verify:
   - Page renders without errors
   - Expected UI elements are visible (cards, tables, buttons, badges)
   - Responsive layout works (check mobile viewport too if criterion mentions it)
   - Dark mode if mentioned

### 4. Generate Verification Report

Output a structured report for each criterion:

```
## Verification Report: US-XXX — [Story Title]

### Acceptance Criteria Results

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Create middleware file | PASS | File exists at `app/middleware/admin.ts` |
| 2 | Non-admin redirect | PASS | Line 8: `navigateTo('/')` with toast |
| 3 | Typecheck passes | PASS | `bun run lint` exit code 0 |
| 4 | Verify in browser | PASS | Screenshot: admin page renders correctly |

### Summary
- **Passed:** 4/4
- **Failed:** 0/4
- **Overall:** PASS
```

For failed criteria, include specific details about what's missing or incorrect, with file paths and line numbers.

### 5. Update PRD (Optional)

If all criteria pass and the user confirms, update `scripts/ralph/prd.json`:
- Set `"passes": true` for the verified story
- Add `"verifiedAt": "<ISO timestamp>"` to the story object

If any criteria fail, do NOT update the PRD. Instead, list the remediation steps needed.

## Batch Verification Mode

When asked to "verify all stories" or "audit the PRD":

1. Load all stories from prd.json
2. Filter to stories where `passes: true` (already claimed complete)
3. Run verification on each story sequentially
4. Output a summary table:

```
## PRD Verification Summary

| Story | Title | Claimed | Verified | Issues |
|-------|-------|---------|----------|--------|
| US-001 | Admin middleware | PASS | PASS | - |
| US-002 | Cognito group | PASS | PASS | - |
| US-003 | Admin layout | PASS | FAIL | Missing mobile drawer test |
```

## Quick Check Mode

For fast verification without visual checks, skip the browser verification steps and focus on:
- File existence
- Code pattern matching
- Schema/terraform config checks
- Typecheck

This is useful when the dev server isn't running or for rapid iteration. Use this mode when the user says "quick verify" or "verify without browser".

## Key Project Paths

These are the primary locations to check during verification:

| Area | Path |
|---|---|
| Pages | `app/pages/admin/` |
| Components | `app/components/admin/` |
| Middleware | `app/middleware/` |
| Composables | `app/composables/` |
| Layouts | `app/layouts/` |
| GraphQL queries | `app/graphql/admin.ts` |
| Schema | `terraform/envs/staging/schema.graphql` |
| Resolver functions | `terraform/functions/` |
| Lambda handlers | `terraform/lambda/src/` |
| Terraform config | `terraform/envs/staging/main.tf` |
| Lambda TF config | `terraform/envs/staging/lambda_function.tf` |
| Types | `types/` |
| PRD | `scripts/ralph/prd.json` |
| Progress log | `scripts/ralph/progress.txt` |
