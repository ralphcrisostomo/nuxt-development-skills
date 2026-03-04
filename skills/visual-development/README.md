# visual-development-skill

Claude Code skill for visually verifying UI changes using Playwright screenshots and Compodium component preview.

## What it does

When invoked via `/visual-development-skill`, this skill instructs Claude Code to:

- Start the dev server and take Playwright screenshots after each visual change
- Use Compodium devtools to preview individual components in isolation
- Verify responsive layouts (mobile/desktop viewports) and dark mode
- Follow an iteration loop: change → screenshot → read → verify → repeat

## Installation

Clone the repo and symlink it into your Claude Code skills directory:

```bash
git clone https://github.com/ralphcrisostomo/visual-development-skill.git
ln -s "$(pwd)/visual-development-skill" ~/.claude/skills/visual-development-skill
```

## Usage

In any Claude Code session, invoke the skill:

```
/visual-development-skill
```

The full workflow will load into context, guiding Claude to visually verify all UI changes.
