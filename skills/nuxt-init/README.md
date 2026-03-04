# nuxt-init

AI skill that scaffolds a new Nuxt 4 project with standard config files, dev dependencies, and bun scripts.

## What It Sets Up

- **Prettier** — 4-space indent, CRLF, single quotes, no semis, Pug + Terraform plugins
- **ESLint** — Nuxt ESLint + prettier, Pug tokenizer, TS unused-vars, Vue rules off
- **Vitest** — globals, node env, `~~` and `~` aliases
- **TypeScript** — project references to `.nuxt/tsconfig.*.json`
- **Husky** — `pre-commit` (lint-staged) and `pre-push` (lint + test)
- **SOPS** — age encryption template with placeholder key
- **lint-staged** — eslint fix + prettier write on staged files
- **Scripts** — dev, build, generate, preview, lint, test, pretty, prepare

## Usage

### In a new project

Copy or clone into your project's `.agents/skills/` directory:

```bash
# Clone directly
git clone https://github.com/<user>/nuxt-init .agents/skills/nuxt-init

# Or copy from a local checkout
cp -r /path/to/nuxt-init .agents/skills/nuxt-init
```

Then invoke the skill in Claude Code or any compatible AI agent to scaffold the config files.

### Wire into AGENTS.md

Add a pointer to your project's root `AGENTS.md`:

```markdown
## Project Init

Load the **`nuxt-init`** skill when scaffolding a new Nuxt 4 project or auditing config files.
```

### Sync to .claude/skills/

If your project uses a skills sync script:

```bash
bun skills
```

This copies `.agents/skills/nuxt-init/SKILL.md` to `.claude/skills/nuxt-init/SKILL.md`.
