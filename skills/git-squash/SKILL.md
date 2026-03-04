---
name: git-squash
description: Use when squash-merging a feature branch into main for linear history. Handles pre-flight checks, squash merge, commit delegation to git-commit, and branch cleanup.
---

# Git Squash

## Pre-flight Checks

Before merging, validate the environment:

1. **Determine source branch** — use the argument if provided (`/git-squash feature/my-branch`), otherwise use the current branch.
2. **Verify not on main** — if the source branch is `main`, abort with an error.
3. **Check for uncommitted changes** — run `git status --porcelain`. If there are uncommitted changes, abort and suggest committing or stashing first.
4. **Verify branch exists** — confirm the source branch exists locally (`git rev-parse --verify <branch>`).
5. **Verify divergence from main** — run `git log main..<branch> --oneline`. If empty, abort — nothing to merge.

## Switch to Main

```bash
git checkout main
```

If a remote `origin` exists, pull latest:

```bash
git pull --ff-only
```

If `--ff-only` fails, abort — main has diverged and needs manual resolution.

## Squash Merge

```bash
git merge --squash <branch>
```

If the merge produces conflicts:

1. Abort immediately:
   ```bash
   git merge --abort
   ```
2. Switch back to the source branch:
   ```bash
   git checkout <branch>
   ```
3. Suggest the user rebase first:
   ```
   Merge conflicts detected. Run `git rebase main` on your branch to resolve conflicts, then retry.
   ```
4. Stop — do not proceed.

## Delegate to git-commit

After a successful squash merge, invoke `/git-commit` to handle the commit. This delegates the full 7-step workflow:

1. Sensitive File Guard
2. Auto-stage tracked changes
3. Multi-concern analysis
4. Commit message generation (Conventional Commits with inferred type/scope)
5. Heredoc commit with `Co-Authored-By` trailer
6. Hook failure handling

Do not write commit messages directly — always delegate.

## Post-merge Verification

After the commit succeeds:

```bash
git log --oneline -5
git status
git diff
```

Confirm: clean working tree, squash commit visible at HEAD, no leftover staged changes.

## Cleanup

### Delete local branch

```bash
git branch -d <branch>
```

Use `-d` (safe delete) — git will refuse if the branch has unmerged changes. Never use `-D`.

### Delete remote branch (if exists)

Check if a remote tracking branch exists:

```bash
git ls-remote --heads origin <branch>
```

If it exists:

```bash
git push origin --delete <branch>
```

## Rules

- **Proceed without confirmation** — pre-flight checks are the safety gate. Do not ask the user to approve before merging.
- Only merge into `main` — never squash-merge into other branches.
- Always use `--squash` — never fast-forward or regular merge.
- Always delegate the commit to `/git-commit` — never write commit messages directly.
- Abort on merge conflicts — never auto-resolve.
- Never force-push (`--force`, `--force-with-lease`).
- Never use `git branch -D` — only `-d` (safe delete).
- If any step fails, stop and report the error — do not continue the workflow.

## Quick Reference

- Pre-flight: verify branch, check uncommitted changes, confirm divergence from main.
- Switch to main, pull latest with `--ff-only`.
- `git merge --squash <branch>` — abort on conflicts, suggest rebase.
- Delegate commit to `/git-commit` (Sensitive File Guard, Conventional Commits, heredoc).
- Verify: `git log`, `git status`, `git diff`.
- Cleanup: `git branch -d`, `git push origin --delete` (if remote exists).
