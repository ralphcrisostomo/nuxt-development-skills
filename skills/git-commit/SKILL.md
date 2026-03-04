---
name: git-commit
description: Use when committing changes, staging files, or finishing work in a git worktree. Covers smart commit, multi-concern splitting, sensitive-file guarding, and worktree merge.
---

# Git Commit Skill

## Sensitive File Guard

Before staging, scan `git status` for sensitive patterns:

- `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`
- `*.tfstate`, `*.tfvars` (with real values)
- `credentials.json`, `serviceAccountKey.json`, `*secret*`

If a match is found:

1. Append the missing pattern to `.gitignore` and stage `.gitignore`.
2. If the file is already tracked, warn and suggest `git rm --cached <file>`.
3. Never proceed with committing a sensitive file.

## Smart Commit Workflow

### 1. Review

```bash
git status
git diff
git diff --cached
git log --oneline -5
```

### 2. Run Sensitive File Guard

Scan the output of `git status` against the patterns above.

### 3. Auto-stage tracked changes

```bash
git add -u
```

Stage tracked modifications and deletions only. Do not stage untracked files automatically — review them first and stage by name if appropriate.

### 4. Analyse for multi-concern splitting

Group changed files by directory or feature area. If changes span unrelated concerns (e.g. a bug fix and a new feature), split into separate commits automatically.

### 5. Generate commit message

- Infer **type** from the change: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.
- Infer **scope** from the primary directory or feature area (e.g. `components`, `terraform`, `skills`).
- Subject line: imperative voice, under 72 characters.
- Body (optional): explain "why", not "what".

### 6. Commit via heredoc

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject line

Optional body.

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"
```

Replace `<model>` with the actual model name (e.g. `Opus 4.6`, `Sonnet 4.6`).

### 7. Handle pre-commit hook failure

Fix the issue, re-stage, and create a **new** commit. Never use `--no-verify`. Never amend — the failed commit does not exist.

## Worktree Workflow

When working in a git worktree (`.claude/worktrees/<name>/`):

1. **Smart commit** all changes in the worktree using the workflow above.
2. **Switch to `main`** in the primary working directory.
3. **Squash-merge** the worktree branch:
   ```bash
   git merge --squash <worktree-branch>
   ```
4. **Commit** the squashed result with a single well-formed message.
5. **Verify**: `git log --oneline -5 && git status`.
6. **Remove** the worktree: `git worktree remove .claude/worktrees/<name>`.

Rules: commit before merging, always merge into `main`, never delete the branch before merge is confirmed, use `--squash` to keep history linear.

## Rules

- **Proceed without confirmation** — do not ask the user to approve the commit message or confirm before committing. Stage, generate the message, and commit in one flow.
- Never commit sensitive files (run the guard first).
- Never amend a published commit — create a new one.
- Never force-push `main`.
- Never use `--no-verify` or `--no-gpg-sign`.
- Prefer named files over `git add -A` to avoid staging secrets or noise.
- Formatting and linting run automatically via hooks.

## Quick Reference

- Run Sensitive File Guard before every commit.
- Auto-stage tracked changes with `git add -u`, review untracked files individually.
- Split unrelated concerns into separate commits.
- Conventional Commits with auto-detected type and scope.
- Commit via heredoc with `Co-Authored-By` trailer.
- Worktree: commit, squash-merge to main, verify, remove.
