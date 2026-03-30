#!/usr/bin/env bash
# ============================================================
#  view-dashboard.sh
#  Opens the Unified Dashboard in the system's default browser.
# ============================================================

URL="http://localhost:3000"

echo "📡 Geordi is checking the visual sensors... looking for the Dashboard on port 3000."

# Wait up to 20 seconds for the server to be ready
MAX_RETRIES=10
COUNT=0
while ! curl -s "$URL" > /dev/null; do
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "⚠️ Warning: Dashboard doesn't seem to be running at $URL yet. Opening anyway..."
    break
  fi
  echo "⏳ Waiting for the Bridge to come online... ($((COUNT+1))/$MAX_RETRIES)"
  sleep 2
  ((COUNT++))
done

echo "🚀 Navigating to the Observation Lounge at $URL..."

if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  command -v xdg-open > /dev/null && xdg-open "$URL" || echo "🌐 Please open $URL manually."
else
  # Fallback for Windows/WSL
  explorer.exe "$URL" 2>/dev/null || echo "🌐 Please open $URL in your default browser."
fi