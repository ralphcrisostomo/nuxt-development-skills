# nuxt-development-skills

A consolidated collection of Claude Code agent skills for Nuxt 4 development workflows.

## Skills

| Skill | Description |
| --- | --- |
| [git-commit](skills/git-commit/) | Smart commit workflow with multi-concern splitting, sensitive-file guarding, and worktree merge support. |
| [git-squash](skills/git-squash/) | Squash-merge a feature branch into main for linear history. Handles pre-flight checks, squash merge, commit delegation, and branch cleanup. |
| [nuxt-init](skills/nuxt-init/) | Scaffold a new Nuxt 4 project with standard config files (prettier, eslint, gitignore, husky, vitest, tsconfig, sops) and bun scripts. |
| [nuxt-terraform](skills/nuxt-terraform-skill/) | Scaffold Nuxt + AWS Terraform infrastructure with AppSync, DynamoDB, Cognito, Lambda functions, and GraphQL resolvers. |
| [optimise-claude](skills/optimise-claude/) | Audit, trim, or restructure AI skill files to reduce context-window consumption. |
| [prd](skills/prd/) | Generate a Product Requirements Document (PRD) for a new feature. Use when planning a feature, starting a new project, or writing requirements. |
| [ralph](skills/ralph/) | Convert PRDs to prd.json format for the Ralph autonomous agent system. |
| [tailwind-ui](skills/tailwind-ui/) | Write HTML/JSX with Tailwind CSS for common UI patterns — heroes, forms, lists, navbars, modals, cards, and more. |
| [visual-development](skills/visual-development/) | Develop or modify visual elements with Playwright screenshots, Compodium component preview, and responsive/dark-mode verification. |

## Installation

Install individual skills using [`npx skills add`](https://github.com/anthropics/skills):

```bash
npx skills add ralphcrisostomo/nuxt-development-skills/skills/<skill-name>
```

For example:

```bash
npx skills add ralphcrisostomo/nuxt-development-skills/skills/tailwind-ui
npx skills add ralphcrisostomo/nuxt-development-skills/skills/git-commit
```

## License

MIT
