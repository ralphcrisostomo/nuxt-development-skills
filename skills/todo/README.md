# todo

Scan a codebase for incomplete work and maintain a living `TODO.md` grouped by feature for `/prd` input.

## What It Does

| Capability | Description |
| --- | --- |
| **Gap scanning** | Finds `TODO`/`FIXME` comments, mock data, placeholder components, missing pages, untested code, stub files |
| **Feature grouping** | Organises findings into logical feature clusters ready for `/prd` |
| **PRD awareness** | Checks `tasks/prd-*.md` and annotates groups that already have specs |
| **Incremental update** | Uses `git log` to mark completed items, adds new gaps, never removes unchecked items |
| **Timestamped** | Tracks `Last updated` date for incremental updates |

## Usage

Invoke via `/todo` in Claude Code.

- **First run:** scans codebase, creates `TODO.md` at project root
- **Subsequent runs:** updates existing `TODO.md` — marks completed items, adds new gaps

## Workflow

```
/todo ──► Scan codebase ──► Group by feature ──► TODO.md
                                                    │
                                                    ▼
/todo ──► git log since ──► Mark [x] done ──► Re-scan ──► Update TODO.md
              last run          items            gaps
```

## Integration with /prd and /ralph

```
/todo ──► TODO.md items ──► /prd ──► tasks/prd-*.md ──► /ralph ──► prd.json
```

1. Run `/todo` to discover what needs building
2. Pick a feature group and run `/prd` to spec it out
3. Run `/ralph` to convert the PRD for autonomous execution
