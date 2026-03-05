# Lambda Source Templates

Files created in `terraform/lambda/src/<FULL_NAME>/` for each Lambda function.

| File | Placeholders | Description | Source |
|---|---|---|---|
| `index.ts` | `{{FULL_NAME}}` — full Lambda name (e.g. `MyAppRedeemNow`) | Handler stub with logging and TODO | [templates/lambda/index.ts.tpl](../templates/lambda/index.ts.tpl) |
| `package.json` | None | Version metadata `{"version":"0.0.1","lastBuildAt":""}` | _(inline, no template)_ |
| `AGENTS.md` | `{{DESCRIPTION}}` — purpose string | Lambda guidelines for AI agents | [templates/lambda/AGENTS.md.tpl](../templates/lambda/AGENTS.md.tpl) |
| `GEMINI.md` | None | Points to AGENTS.md via `@./AGENTS.md` | [templates/lambda/GEMINI.md.tpl](../templates/lambda/GEMINI.md.tpl) |
