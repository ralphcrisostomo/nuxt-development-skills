# squash

A project-agnostic AI skill for squash-merging feature branches into main with linear history. Designed for [Claude Code](https://claude.ai/code) and compatible with any AI agent that loads `.claude/skills/` or `.agents/skills/` files.

## What it does

| Capability | Description |
|---|---|
| **Pre-flight Checks** | Validates source branch, checks for uncommitted changes, confirms divergence from main before proceeding. |
| **Squash Merge** | Merges the feature branch into main with `--squash` to keep history linear — one clean commit per branch. |
| **Conflict Safety** | Aborts immediately on merge conflicts, returns to the source branch, and suggests `git rebase main`. |
| **Commit Delegation** | Delegates the commit to `commit` for Sensitive File Guard, Conventional Commits, and heredoc format. |
| **Branch Cleanup** | Safe-deletes the local branch (`-d`) and removes the remote tracking branch if it exists. |

## Installation

Copy `SKILL.md` into your project's skill directory:

```bash
# For Claude Code
mkdir -p .claude/skills/squash
cp SKILL.md .claude/skills/squash/

# Or if using .agents/skills/ as source of truth
mkdir -p .agents/skills/squash
cp SKILL.md .agents/skills/squash/
```

The skill activates when the agent detects a squash-merge task or is invoked directly.

## Dependency

This skill requires **commit** to be installed in the same project. The commit step is fully delegated — `squash` never writes commit messages directly.

```bash
# Ensure commit is also installed
ls .claude/skills/commit/SKILL.md
```

## Workflow overview

```
Pre-flight → checkout main → git merge --squash → /commit → verify → cleanup
```

1. **Pre-flight** — validate source branch, check uncommitted changes, confirm divergence
2. **Switch to main** — `git checkout main`, `git pull --ff-only`
3. **Squash merge** — `git merge --squash <branch>` (abort on conflicts)
4. **Commit** — delegate to `/commit` (guard, stage, message, heredoc, hooks)
5. **Verify** — `git log`, `git status`, `git diff`
6. **Cleanup** — `git branch -d <branch>`, `git push origin --delete <branch>`

## Usage

```bash
# Squash-merge the current branch into main
/squash

# Squash-merge a specific branch into main
/squash feature/my-branch
```

## Rules

- Never merge into branches other than `main`
- Never fast-forward or regular merge — always `--squash`
- Never auto-resolve merge conflicts — abort and suggest rebase
- Never force-push
- Never use `git branch -D` — only safe delete (`-d`)

## License

MIT
