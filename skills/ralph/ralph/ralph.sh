#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [--tool amp|claude] [max_iterations]

set -e

# Parse arguments
TOOL="claude"  # Default to claude for this project
MAX_ITERATIONS=10
NTFY_TOPIC="${NTFY_TOPIC:-hbm-ralph}"
NTFY_BASE_URL="${NTFY_BASE_URL:-https://ntfy.sh}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    *)
      # Assume it's max_iterations if it's a number
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Validate tool choice
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

notify() {
  local title="$1" message="$2" priority="${3:-default}" tags="${4:-robot}"
  local branch="unknown"
  local story_title="unknown"
  if [ -f "$PRD_FILE" ]; then
    branch=$(jq -r '.branchName // "unknown"' "$PRD_FILE" 2>/dev/null || echo "unknown")
    story_title=$(jq -r '[.userStories[] | select(.passes != true)] | first | .title // "unknown"' "$PRD_FILE" 2>/dev/null || echo "unknown")
  fi
  curl -sf \
    -H "Title: $title" \
    -H "Priority: $priority" \
    -H "Tags: $tags" \
    -d "$story_title story from $branch branch, $message" \
    "$NTFY_BASE_URL/$NTFY_TOPIC" > /dev/null 2>&1 || true
}

LOG_FILE="$SCRIPT_DIR/ralph.log"

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

# PRD summary
if [ -f "$PRD_FILE" ]; then
  PRD_NAME=$(jq -r '.project // .name // "unknown"' "$PRD_FILE" 2>/dev/null)
  PRD_BRANCH=$(jq -r '.branchName // "unknown"' "$PRD_FILE" 2>/dev/null)
  TOTAL_STORIES=$(jq '[.userStories[]] | length' "$PRD_FILE" 2>/dev/null || echo "?")
  DONE_STORIES=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
  log "PRD: $PRD_NAME"
  log "Branch: $PRD_BRANCH"
  log "Stories: $DONE_STORIES/$TOTAL_STORIES complete"
else
  log "WARNING: No prd.json found at $PRD_FILE"
fi

# Worktree setup — isolate each ralph session so multiple can run in parallel
REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
if [ -n "$PRD_BRANCH" ] && [ "$PRD_BRANCH" != "unknown" ]; then
  REPO_NAME=$(basename "$REPO_ROOT")
  WORKTREE_BASE="$(dirname "$REPO_ROOT")/.worktrees"
  BRANCH_DIR=$(echo "$PRD_BRANCH" | sed 's|/|-|g')
  WORKTREE_DIR="$WORKTREE_BASE/$REPO_NAME-$BRANCH_DIR"

  if [ ! -d "$WORKTREE_DIR" ]; then
    log "Creating worktree at $WORKTREE_DIR for branch $PRD_BRANCH"
    mkdir -p "$WORKTREE_BASE"
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$PRD_BRANCH"; then
      git -C "$REPO_ROOT" worktree add "$WORKTREE_DIR" "$PRD_BRANCH"
    else
      git -C "$REPO_ROOT" worktree add -b "$PRD_BRANCH" "$WORKTREE_DIR" main
    fi
  else
    log "Using existing worktree at $WORKTREE_DIR"
  fi

  # Sync ralph files to worktree
  RALPH_REL_PATH="${SCRIPT_DIR#$REPO_ROOT/}"
  WORKTREE_RALPH="$WORKTREE_DIR/$RALPH_REL_PATH"
  mkdir -p "$WORKTREE_RALPH"
  cp "$PRD_FILE" "$WORKTREE_RALPH/"
  [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$WORKTREE_RALPH/"
  cp "$SCRIPT_DIR/CLAUDE.md" "$WORKTREE_RALPH/"

  WORK_DIR="$WORKTREE_DIR"
  WORK_RALPH="$WORKTREE_RALPH"
  log "Worktree ready at $WORKTREE_DIR"
else
  WORK_DIR="$REPO_ROOT"
  WORK_RALPH="$SCRIPT_DIR"
  WORKTREE_DIR=""
fi

CUMULATIVE_INPUT_TOKENS=0
CUMULATIVE_OUTPUT_TOKENS=0
CUMULATIVE_COST=0

log "Starting Ralph - Tool: $TOOL - Max iterations: $MAX_ITERATIONS"
log "Log file: $LOG_FILE"
notify "Ralph Started: ${PRD_NAME:-unknown}" "running with $TOOL for up to $MAX_ITERATIONS iterations, with ${DONE_STORIES:-?}/${TOTAL_STORIES:-?} stories complete." "default" "rocket"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  # Show which story is next
  if [ -f "$PRD_FILE" ]; then
    NEXT_STORY=$(jq -r '[.userStories[] | select(.passes != true)] | first | "\(.id) - \(.title)"' "$PRD_FILE" 2>/dev/null || echo "unknown")
    log "Next story: $NEXT_STORY"
  fi

  ITER_START=$(date +%s)

  # Run the selected tool from the working directory (worktree or repo root)
  INPUT_TOKENS="?"
  OUTPUT_TOKENS="?"
  COST_USD="?"
  if [[ "$TOOL" == "amp" ]]; then
    OUTPUT=$(cd "$WORK_DIR" && cat "$WORK_RALPH/prompt.md" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
  else
    # Use JSON output to capture token usage; stderr streams to terminal
    RAW_OUTPUT=$(cd "$WORK_DIR" && claude --dangerously-skip-permissions --print --output-format json < "$WORK_RALPH/CLAUDE.md" 2>/dev/stderr) || true
    INPUT_TOKENS=$(echo "$RAW_OUTPUT" | jq -r '.input_tokens // 0' 2>/dev/null || echo "?")
    OUTPUT_TOKENS=$(echo "$RAW_OUTPUT" | jq -r '.output_tokens // 0' 2>/dev/null || echo "?")
    COST_USD=$(echo "$RAW_OUTPUT" | jq -r '.cost_usd // "?"' 2>/dev/null || echo "?")
    OUTPUT=$(echo "$RAW_OUTPUT" | jq -r '.result // empty' 2>/dev/null || echo "$RAW_OUTPUT")
  fi
  TOTAL_TOKENS=$(( ${INPUT_TOKENS:-0} + ${OUTPUT_TOKENS:-0} )) 2>/dev/null || TOTAL_TOKENS="?"
  TOKEN_INFO="${INPUT_TOKENS}in/${OUTPUT_TOKENS}out (\$${COST_USD})"
  # Accumulate totals
  CUMULATIVE_INPUT_TOKENS=$(( CUMULATIVE_INPUT_TOKENS + ${INPUT_TOKENS:-0} )) 2>/dev/null || true
  CUMULATIVE_OUTPUT_TOKENS=$(( CUMULATIVE_OUTPUT_TOKENS + ${OUTPUT_TOKENS:-0} )) 2>/dev/null || true
  CUMULATIVE_COST=$(echo "$CUMULATIVE_COST + ${COST_USD:-0}" | bc 2>/dev/null || echo "$CUMULATIVE_COST")

  # Sync files back from worktree
  if [ -n "$WORKTREE_DIR" ] && [ -d "$WORKTREE_DIR" ]; then
    [ -f "$WORK_RALPH/prd.json" ] && cp "$WORK_RALPH/prd.json" "$PRD_FILE"
    [ -f "$WORK_RALPH/progress.txt" ] && cp "$WORK_RALPH/progress.txt" "$PROGRESS_FILE"
  fi

  ITER_END=$(date +%s)
  ITER_DURATION=$(( ITER_END - ITER_START ))
  ITER_MINS=$(( ITER_DURATION / 60 ))
  ITER_SECS=$(( ITER_DURATION % 60 ))

  # Update story counts
  if [ -f "$PRD_FILE" ]; then
    DONE_STORIES=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
  fi

  EXIT_CODE=$?
  OUTPUT_LINES=$(echo "$OUTPUT" | wc -l | tr -d ' ')
  log "Iteration $i finished in ${ITER_MINS}m${ITER_SECS}s (exit: $EXIT_CODE, output: ${OUTPUT_LINES} lines, tokens: $TOKEN_INFO, stories: ${DONE_STORIES:-?}/${TOTAL_STORIES:-?})"

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    log "Ralph completed all tasks!"
    log "Completed at iteration $i of $MAX_ITERATIONS"
    # Clean up worktree
    if [ -n "$WORKTREE_DIR" ] && [ -d "$WORKTREE_DIR" ]; then
      log "Cleaning up worktree at $WORKTREE_DIR"
      git -C "$REPO_ROOT" worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
    fi
    CUMULATIVE_INFO="${CUMULATIVE_INPUT_TOKENS}in/${CUMULATIVE_OUTPUT_TOKENS}out (\$${CUMULATIVE_COST})"
    log "Total tokens: $CUMULATIVE_INFO"
    notify "Ralph Complete: ${PRD_NAME:-unknown}" "completed all ${TOTAL_STORIES:-?} stories at iteration $i/$MAX_ITERATIONS in ${ITER_MINS}m${ITER_SECS}s. Total tokens: $CUMULATIVE_INFO" "high" "white_check_mark"
    exit 0
  fi

  # Check if output is suspiciously short (possible error)
  if [ "$OUTPUT_LINES" -lt 5 ]; then
    log "WARNING: Very short output ($OUTPUT_LINES lines) - possible error"
  fi

  notify "Ralph Iteration $i: ${PRD_NAME:-unknown}" "completed in ${ITER_MINS}m${ITER_SECS}s, ${DONE_STORIES:-?}/${TOTAL_STORIES:-?} stories. Tokens: $TOKEN_INFO" "default" "robot"
  log "Sleeping 2s before next iteration..."
  sleep 2
done

echo ""
CUMULATIVE_INFO="${CUMULATIVE_INPUT_TOKENS}in/${CUMULATIVE_OUTPUT_TOKENS}out (\$${CUMULATIVE_COST})"
log "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
log "Total tokens: $CUMULATIVE_INFO"
log "Check $PROGRESS_FILE for status."
notify "Ralph Stopped: ${PRD_NAME:-unknown}" "reached max iterations ($MAX_ITERATIONS). Total tokens: $CUMULATIVE_INFO" "high" "warning"
exit 1
