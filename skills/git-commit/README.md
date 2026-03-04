# git-commit-skill

A project-agnostic AI skill for safe, structured git commits. Designed for [Claude Code](https://claude.ai/code) and compatible with any AI agent that loads `.claude/skills/` or `.agents/skills/` files.

## What it does

| Capability | Description |
|---|---|
| **Sensitive File Guard** | Scans `git status` for secrets (`.env*`, `*.pem`, `*.key`, `*.tfstate`, `credentials.json`, etc.) before staging. Auto-updates `.gitignore` and warns about tracked sensitive files. |
| **Smart Commit** | 7-step workflow: review, guard, auto-stage tracked changes, analyse for multi-concern splitting, generate Conventional Commit message with inferred type/scope, commit via heredoc, handle hook failures. |
| **Multi-concern Splitting** | Groups changes by directory/feature and suggests separate commits when unrelated concerns are mixed. |
| **Worktree Merge** | Commit in worktree, squash-merge to `main`, verify, remove — keeps history linear. |

## Installation

Copy `SKILL.md` into your project's skill directory:

```bash
# For Claude Code
mkdir -p .claude/skills/git-commit-skill
cp SKILL.md .claude/skills/git-commit-skill/

# Or if using .agents/skills/ as source of truth
mkdir -p .agents/skills/git-commit-skill
cp SKILL.md .agents/skills/git-commit-skill/
```

The skill activates automatically when the agent detects a commit-related task.

## Workflow overview

```
git status → Sensitive File Guard → git add -u → Split check → Commit message → Commit → Hook fix (if needed)
```

1. **Review** — `git status`, `git diff`, `git log --oneline -5`
2. **Guard** — scan for sensitive file patterns, update `.gitignore`
3. **Stage** — `git add -u` (tracked only), review untracked individually
4. **Split** — group by directory/feature, suggest splitting if unrelated
5. **Message** — Conventional Commits (`feat`/`fix`/`chore`/`docs`/`refactor`/`test`/`style`) with auto-detected scope
6. **Commit** — heredoc format with `Co-Authored-By` trailer
7. **Hook failure** — fix, re-stage, new commit (never `--no-verify`)

## Rules

- Never commit sensitive files
- Never amend published commits
- Never force-push `main`
- Never use `--no-verify` or `--no-gpg-sign`
- Prefer named files over `git add -A`

## License

MIT
