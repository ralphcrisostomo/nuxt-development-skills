#!/bin/bash
set -e

NAME="$1"
shift 2>/dev/null || true

if [ -z "$NAME" ]; then
  echo "Usage: ralph-tree <worktree-name> [--tool amp|claude] [max_iterations]"
  exit 1
fi

WORKTREE_PATH="$(pwd)/.claude/worktrees/$NAME"

if [ ! -d "$WORKTREE_PATH" ]; then
  echo "Error: Worktree not found: $WORKTREE_PATH"
  exit 1
fi

RALPH_SCRIPT="$WORKTREE_PATH/scripts/ralph/ralph.sh"

if [ ! -f "$RALPH_SCRIPT" ]; then
  echo "Error: ralph.sh not found at $RALPH_SCRIPT"
  exit 1
fi

cd "$WORKTREE_PATH" && bash "$RALPH_SCRIPT" "$@"
