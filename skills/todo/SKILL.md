---
name: todo
description: "Use when scanning a codebase for incomplete work and maintaining a living TODO.md grouped by feature. Triggers on: scan for todos, find incomplete work, update todo, what needs doing, create todo list."
user-invocable: true
---

# TODO Scanner

Scan a codebase for incomplete work and maintain a living `TODO.md` grouped by feature clusters ready for `/prd` input.

---

## The Job

Detect which workflow to run:

- **TODO.md does not exist** → Initial Creation
- **TODO.md exists** → Subsequent Update

**Important:** Do NOT implement anything. Only inventory and organise.

---

## Workflow: Initial Creation

### 1. Scan Codebase for Gaps

Search for each category and collect findings:

| Category | What to look for |
| --- | --- |
| Code comments | `TODO`, `FIXME`, `HACK`, `XXX`, `PLACEHOLDER` |
| Mock data | Hardcoded arrays, `faker`, `seed`, `mock` in non-test files |
| Placeholder components | Empty `<div>` bodies, `<!-- TODO -->`, stub templates |
| Missing pages | Routes referencing nonexistent files |
| Untested code | Source files with no corresponding test file |
| Empty/stub files | Files under 5 lines, empty function bodies |
| Design references | Mockups, wireframes in `docs/`, `designs/`, `assets/` |

### 2. Check Existing PRDs

Read `tasks/prd-*.md` files. Any feature already spec'd should be noted, not duplicated.

### 3. Group into Feature Clusters

Organise findings into logical feature groups. Each group name should be descriptive enough to feed directly into `/prd`.

### 4. Write TODO.md

Write to project root using the format below.

---

## Workflow: Subsequent Update

### 1. Read Timestamp

Parse `Last updated: YYYY-MM-DD` from the existing `TODO.md` header.

### 2. Find Completed Work

Run `git log --since="<timestamp>" --oneline` to find new commits. Map commits to existing unchecked items — mark completed with `[x]` and the commit hash.

### 3. Scan for New Gaps

Re-run the same codebase scan from Initial Creation. Add new findings to existing groups or create new groups.

### 4. Re-check PRDs

Read `tasks/prd-*.md` for any newly created PRDs since last update. Add `> PRD exists` annotations.

### 5. Update TODO.md

Update in place. Never remove unchecked items. Update the timestamp.

---

## TODO.md Format

```markdown
# TODO

> Last updated: YYYY-MM-DD via /todo

## [Feature Group Name]
- [ ] Self-contained feature description ready for /prd input
- [x] Completed item (via commit abc1234)

## [Another Feature Group]
> PRD exists: `tasks/prd-feature-name.md`
- [ ] Sub-task not covered by existing PRD
```

### Format Rules

- Each `- [ ]` item must be a self-contained feature description suitable as `/prd` input
- Group names should be clear feature areas, not implementation details
- Include source location in parentheses: `(app/components/Foo.vue:12)`
- Completed items keep their `[x]` with the commit hash — never delete them

---

## Rules

1. **Idempotent** — running twice produces the same result
2. **Additive only** — never remove unchecked items on update
3. **No implementation** — only inventory and organise, never write code
4. **PRD-aware** — check `tasks/prd-*.md` and annotate groups accordingly
5. **Always timestamp** — update `Last updated` on every run
6. **Source locations** — include file paths and line numbers for traceability

---

## Checklist

- [ ] All gap categories scanned; `tasks/prd-*.md` checked
- [ ] Items grouped by feature with source locations
- [ ] Each item is self-contained `/prd` input
- [ ] `Last updated` timestamp set; no unchecked items removed
