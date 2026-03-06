---
name: todo
description: "Use when scanning a codebase for incomplete work and maintaining a living TODO.md grouped by feature. Triggers on: scan for todos, find incomplete work, update todo, what needs doing, create todo list."
user-invocable: true
---

# TODO Scanner

Scan a codebase for incomplete work and maintain a living `TODO.md` grouped by feature clusters ready for `/prd` input. Do NOT implement anything — only inventory and organise.

---

## Detect Workflow

- **TODO.md does not exist** → run Steps 1–4 (Initial Creation)
- **TODO.md exists** → run Steps 0–4 (Subsequent Update)

---

## Step 0 — Find Completed Work (update only)

Parse `Last updated: YYYY-MM-DD` from existing `TODO.md`. Run `git log --since="<timestamp>" --oneline`, map commits to unchecked items, mark completed with `[x]` and commit hash. Never remove unchecked items.

## Step 1 — Scan Codebase for Gaps

Search for each category and collect findings:

- **Code comments**: `TODO`, `FIXME`, `HACK`, `XXX`, `PLACEHOLDER`
- **Mock data**: Hardcoded arrays, `faker`, `seed`, `mock` in non-test files
- **Placeholder components**: Empty `<div>` bodies, `<!-- TODO -->`, stub templates
- **Missing pages**: Routes referencing nonexistent files
- **Untested code**: Source files with no corresponding test file
- **Empty/stub files**: Files under 5 lines, empty function bodies
- **Design references**: Mockups, wireframes in `docs/`, `designs/`, `assets/`

## Step 2 — Check PRDs

Read `tasks/prd-*.md`. Annotate groups with `> PRD exists` — don't duplicate already-spec'd features.

## Step 3 — Group into Feature Clusters

Organise findings into logical feature groups. Each group name should be descriptive enough to feed directly into `/prd`.

## Step 4 — Write / Update TODO.md

Write to project root. On update, preserve all unchecked items and update the timestamp.

```markdown
# TODO

> Last updated: YYYY-MM-DD via /todo

## [Feature Group Name]
- [ ] Self-contained feature description ready for /prd input (app/components/Foo.vue:12)
- [x] Completed item (via commit abc1234)

## [Another Feature Group]
> PRD exists: `tasks/prd-feature-name.md`
- [ ] Sub-task not covered by existing PRD (src/pages/bar.vue:5)
```

---

## Rules

1. **Idempotent** — running twice produces the same result
2. **Additive only** — never remove unchecked items on update
3. **No implementation** — only inventory and organise, never write code
4. **PRD-aware** — check `tasks/prd-*.md` and annotate groups accordingly
5. **Always timestamp** — update `Last updated` on every run
6. **Source locations** — include file:line for traceability
7. **Self-contained items** — each `- [ ]` must work as standalone `/prd` input

---

## Checklist

- [ ] All gap categories scanned; `tasks/prd-*.md` checked
- [ ] Items grouped by feature with source locations
- [ ] Each item is self-contained `/prd` input
- [ ] `Last updated` timestamp set; no unchecked items removed
