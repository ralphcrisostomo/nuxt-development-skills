# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A consolidated collection of reusable Claude Code agent skills for Nuxt 4 development workflows. Each skill lives under `skills/<name>/` and is installed individually into target projects via `npx skills add ralphcrisostomo/nuxt-development-skills/skills/<name>`.

This repo has no root package.json, no build step, and no tests — it is a pure skill library.

## Skills

| Skill | Purpose |
| --- | --- |
| commit | Smart commit with multi-concern splitting, sensitive-file guarding, worktree merge |
| squash | Squash-merge feature branches into main with linear history |
| nuxt-init | Scaffold Nuxt 4 project with standard configs (prettier, eslint, husky, vitest, sops) |
| nuxt-terraform | Scaffold Nuxt + AWS Terraform (AppSync, DynamoDB, Cognito, Lambda) |
| nuxt-visual-development | Visual dev loop with Playwright screenshots, Compodium, responsive/dark-mode |
| nuxt-env | Set up SOPS + age encryption for env variables |
| optimise-claude | Audit/trim skill files to reduce context-window consumption |
| prd | Generate Product Requirements Documents |
| ralph | Convert PRDs to prd.json for Ralph autonomous agent |
| tailwind-ui | Tailwind CSS UI patterns from 657 pre-built templates |
| todo | Scan codebase for incomplete work, maintain living TODO.md grouped by feature for /prd input |

## Skill File Structure

Every skill follows this layout:

```
skills/<name>/
├── SKILL.md          # Primary instruction file (required)
├── README.md         # Human-readable overview
├── scripts/          # Utility scripts to copy into target projects
├── templates/        # Code templates
├── references/       # Detailed docs for functions, modules, configs
└── assets/           # Pre-built resources (e.g., tailwind-ui templates)
```

## SKILL.md Conventions

- YAML frontmatter with `name` (kebab-case, matches directory) and `description` (starts with "Use when")
- Optional `model` field with recommended Claude model (e.g., `opus`, `sonnet`, `haiku`)
- Optional `user-invocable: true` for skills invokable via `/skill-name`
- Target ≤120 lines to reduce token usage (enforced by optimise-claude skill)
- Canonical section order: Title → When to Use → Workflow/Instructions → Rules/Quick Reference → Validation/Checklist

## Commit Convention

Conventional Commits format: `type(scope): subject`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
- Scope: skill name or feature area (e.g., `nuxt-terraform`, `skills`)
- Trailer: `Co-Authored-By: Claude <model> <noreply@anthropic.com>`

## Cross-Cutting Patterns

- **Idempotency**: All skills skip existing files rather than overwriting — warn the user instead
- **Pre-flight validation**: Check dependencies, read configs, confirm file states before proceeding
- **bun as runtime**: All Nuxt projects use `bun` (not npm/yarn/pnpm)
- **Sensitive file guarding**: `.env*`, `*.pem`, `*.key`, `*.tfstate`, `*.tfvars` are never committed without warning
