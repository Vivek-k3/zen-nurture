#!/bin/bash
# agent-browser flow: sign in and navigate pages
set -e
URL="http://localhost:4861"

if [ -z "${EMAIL:-}" ] || [ -z "${PASS:-}" ]; then
  echo "EMAIL and PASS environment variables must be set before running scripts/browser-test.sh" >&2
  exit 1
fi

echo "1. Opening sign-in..."
agent-browser open "$URL/sign-in" 2>&1

echo "2. Snapshot..."
agent-browser snapshot -i 2>&1 | head -80

echo "3. Filling form (semantic locators)..."
agent-browser find label "Email" fill "$EMAIL" 2>&1
agent-browser find label "Password" fill "$PASS" 2>&1

echo "4. Clicking Sign In..."
agent-browser find role button click --name "Sign In" 2>&1

echo "5. Waiting for redirect..."
sleep 3

echo "6. Snapshot after login..."
agent-browser snapshot -i 2>&1 | head -50

echo "7. Navigating to Trends..."
agent-browser open "$URL/trends" 2>&1 || true
sleep 2

echo "8. Navigating to Reminders..."
agent-browser open "$URL/reminders" 2>&1 || true
sleep 2

echo "9. Navigating to Records..."
agent-browser open "$URL/records" 2>&1 || true
sleep 2

echo "10. Navigating to Settings..."
agent-browser open "$URL/settings" 2>&1 || true

echo "11. Console errors?"
agent-browser console 2>&1 | tail -30

echo "Done."
