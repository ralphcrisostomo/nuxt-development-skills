# optimise-claude

AI skill that audits and optimises instruction files (CLAUDE.md, SKILL.md, AGENTS.md) to reduce context-window consumption.

## What It Does

- **Inventory & Triage** — lists all instruction files, flags line count / frontmatter / structure violations
- **Audit CLAUDE.md** — applies the "would removing cause mistakes?" litmus test, enforces official include/exclude criteria, migrates domain content to skills, suggests `@import` splitting
- **Reduce SKILL.md Token Usage** — trims prose, collapses examples, targets <=120 lines per skill
- **Fix Structure** — enforces canonical section order, corrects frontmatter
- **Cross-Skill Dedup** — finds repeated content, consolidates, rewords overlapping triggers
- **Extract AGENTS.md Blocks** — converts inline blocks >30 lines into standalone skills

## Based On

[Claude Code Best Practices — Write an effective CLAUDE.md](https://code.claude.com/docs/en/best-practices#write-an-effective-claude-md)

## Usage

Invoke the skill in Claude Code or any compatible AI agent to audit and optimise instruction files.

### Wire into AGENTS.md

Add a pointer to your project's root `AGENTS.md`:

```markdown
## Skill Optimisation

Load the **`optimise-claude`** skill when auditing, trimming, or restructuring AI instruction files to reduce context-window consumption.
```

### Sync to .claude/skills/

After creating or updating the skill, run:

```bash
bun skills
```

This copies `.agents/skills/optimise-claude/SKILL.md` to `.claude/skills/optimise-claude/SKILL.md`.
