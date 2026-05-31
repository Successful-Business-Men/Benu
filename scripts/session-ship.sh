#!/usr/bin/env bash
# Ship the current worktree's work to the live branch (static-html-version) and deploy.
# Run this from INSIDE a session worktree created by session-start.sh.
#
# It commits your changes, replays them on top of the latest live branch, and
# fast-forwards the live branch (which triggers the deploy). It retries if another
# session ships at the same moment, so 10+ sessions can ship safely.
#
# Usage:  bash scripts/session-ship.sh "short message about what changed"
set -e

msg="${1:-Update from session}"

git add -A
git commit -m "$msg" || echo "(nothing new to commit)"

for i in 1 2 3 4 5 6; do
  git fetch origin static-html-version -q
  if ! git rebase origin/static-html-version; then
    echo ""
    echo "Merge conflict (two sessions changed the same lines)."
    echo "Fix the conflicted file, then run:  git rebase --continue && bash scripts/session-ship.sh"
    exit 1
  fi
  if git push origin HEAD:static-html-version 2>/dev/null; then
    echo ""
    echo "Shipped. The GitHub Action will publish to better-menu-eight.vercel.app in ~1-2 min."
    exit 0
  fi
  echo "Another session shipped first; syncing and retrying ($i)..."
done

echo "Could not fast-forward after several tries. Run the ship command again."
exit 1
