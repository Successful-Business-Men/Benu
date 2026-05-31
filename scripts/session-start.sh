#!/usr/bin/env bash
# Start an isolated worktree for a parallel Claude session.
# Each session gets its own folder and its own branch, so sessions
# can never clobber each other, even on the same file.
#
# Usage:  bash scripts/session-start.sh <name>
#   e.g.  bash scripts/session-start.sh build
set -e

name="$1"
if [ -z "$name" ]; then
  echo "Usage: bash scripts/session-start.sh <name>   (e.g. build, review, catering)"
  exit 1
fi

git fetch origin static-html-version -q
dir="../benu-$name"
branch="session/$name"

git worktree add "$dir" -b "$branch" origin/static-html-version

echo ""
echo "Worktree ready:  $dir"
echo "Branch:          $branch"
echo ""
echo "Open your Claude session in that folder, then edit ONE file (see CLAUDE.md for the map),"
echo "for example js/onboard/$name.js"
echo ""
echo "When you are done, from inside $dir run:"
echo "  bash scripts/session-ship.sh \"what you changed\""
