# nuxt-visual-development

Claude Code skill for visually verifying UI changes using Playwright screenshots and Compodium component preview.

## What it does

When invoked via `/nuxt-visual-development`, this skill instructs Claude Code to:

- Start the dev server and take Playwright screenshots after each visual change
- Use Compodium devtools to preview individual components in isolation
- Verify responsive layouts (mobile/desktop viewports) and dark mode
- Follow an iteration loop: change → screenshot → read → verify → repeat

## Installation

Clone the repo and symlink it into your Claude Code skills directory:

```bash
git clone https://github.com/ralphcrisostomo/nuxt-visual-development.git
ln -s "$(pwd)/nuxt-visual-development" ~/.claude/skills/nuxt-visual-development
```

## Usage

In any Claude Code session, invoke the skill:

```
/nuxt-visual-development
```

The full workflow will load into context, guiding Claude to visually verify all UI changes.
