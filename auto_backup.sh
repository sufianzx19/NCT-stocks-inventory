#!/bin/bash

# Git Auto Backup Script
# Backs up current branch with timestamp and logs all actions

set -e

PROJECT_ROOT="/home/sufian/dev/NCT_Stocks_Inventory"
LOG_FILE="/home/sufian/git_backup.log"
GIT_CMD="/usr/bin/git"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================"
log "Starting Git Auto Backup"
log "========================================"

# Change to project directory
cd "$PROJECT_ROOT" || {
    log "ERROR: Cannot access project directory: $PROJECT_ROOT"
    exit 1
}

log "Project directory: $PROJECT_ROOT"

# Detect current branch
BRANCH=$($GIT_CMD branch --show-current 2>/dev/null)
if [ -z "$BRANCH" ]; then
    log "ERROR: Not a Git repository or cannot detect branch"
    exit 1
fi
log "Current branch: $BRANCH"

# Check for changes
STATUS_OUTPUT=$($GIT_CMD status --porcelain 2>/dev/null)
if [ -z "$STATUS_OUTPUT" ]; then
    log "No changes detected - skipping commit"
    log "Backup completed (no changes)"
    exit 0
fi

log "Changes detected:"
log "$STATUS_OUTPUT"

# Stage all changes
log "Staging changes..."
$GIT_CMD add . || {
    log "ERROR: git add failed"
    exit 1
}

# Create commit with timestamp
COMMIT_MSG="Auto Backup $(date '+%Y-%m-%d %H:%M:%S')"
log "Creating commit: $COMMIT_MSG"
$GIT_CMD commit -m "$COMMIT_MSG" || {
    log "ERROR: git commit failed"
    exit 1
}
log "Commit created successfully"

# Push to remote current branch
log "Pushing to origin/$BRANCH..."
$GIT_CMD push origin "$BRANCH" || {
    log "ERROR: git push failed"
    exit 1
}
log "Push completed successfully"

log "========================================"
log "Backup completed successfully"
log "========================================"

exit 0