---
name: optimise-claude
description: Use when auditing, trimming, or restructuring AI skill files to reduce context-window consumption. Trigger whenever a SKILL.md exceeds 120 lines, skills share duplicated content, AGENTS.md has large inline blocks, or the user asks to optimize, slim down, or reduce token usage of their skills.
---

# Optimise Claude

Audit AI skill files for size, structure, and duplication. Every SKILL.md line costs tokens on every invocation — keeping skills lean directly reduces latency and cost.

## Scope

All operations are scoped to the current project root (`$PWD`). Never modify files outside the project repository.

## When to Use

- Skill files exceed ~120 lines
- Frontmatter or section order is non-canonical
- Multiple skills contain duplicated content
- An AGENTS.md has inline instruction blocks >30 lines that should be skills

## Workflow

Run phases sequentially. Skip any that don't apply.

### Phase 1 — Inventory & Triage

1. List every `SKILL.md` under `.agents/skills/`
2. Record: name, line count, has frontmatter (y/n), canonical sections (y/n)
3. Flag violations: >120 lines, missing/incorrect frontmatter, wrong section order
4. Output a triage table sorted by line count descending

```
| Skill | Lines | FM | Sections | Violations |
|-------|------:|----|----------|------------|
```

### Phase 2 — Reduce Token Usage

For each flagged skill:
- Trim prose to imperative bullets
- Collapse verbose examples to minimal code fences
- Remove redundant explanations covered by parent AGENTS.md
- Remove blank lines between list items
- Target ≤120 lines; if still over, split into focused sub-skills

### Phase 3 — Fix Structure & Frontmatter

- Ensure YAML frontmatter has `name` matching directory, `description` starting with "Use when"
- Enforce section order: H1 title → When to Use → Rules/Instructions → Quick Reference → Validation
- Remove empty or placeholder sections
- Use imperative voice throughout

### Phase 4 — Cross-Skill Deduplication

1. Identify repeated content blocks across skills (>5 similar lines)
2. Move shared content to root `AGENTS.md` or a shared skill
3. Replace duplicates with a one-line pointer: "See `<skill-name>` for …"
4. Reword overlapping `description` fields so each skill has a unique trigger

### Phase 5 — Extract Bloated AGENTS.md Blocks

1. Scan `AGENTS.md` for inline instruction blocks >30 lines
2. Create a new skill at `.agents/skills/<name>/SKILL.md`
3. Replace the original block with a slim pointer + Quick Reference
4. If a skill sync script exists, run it

## Output Format

```
## Optimisation Report

| Skill | Before | After | Delta |
|-------|-------:|------:|------:|
| ...   |    250 |   110 |  -140 |

Total skills: N
Total lines saved: N
New skills created: N
```

## Validation

- `wc -l .agents/skills/*/SKILL.md` — no file exceeds 120 lines
- Every `SKILL.md` has valid YAML frontmatter with `name` and `description`
- No two skills share >5 identical lines
- No `AGENTS.md` has inline instruction blocks >30 lines without a skill pointer
