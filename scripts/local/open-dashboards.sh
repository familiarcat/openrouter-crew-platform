#!/bin/bash

# Function to open URL cross-platform
open_url() {
    local url=$1
    if command -v open &> /dev/null; then
        open "$url"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$url"
    elif command -v start &> /dev/null; then
        start "$url"
    fi
}

# Function to wait for a service and open it
wait_and_open() {
    local port=$1
    local url=$2
    local attempts=0
    local max_attempts=60

    while [ $attempts -lt $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null; then
            echo "✅ Ready: $url"
            open_url "$url"
            return 0
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
    echo "❌ Timeout: $url"
}

echo "⏳ Waiting for dashboards to come online..."

wait_and_open 3000 "http://localhost:3000" &
wait_and_open 3002 "http://localhost:3002" &
wait_and_open 3003 "http://localhost:3003" &
wait_and_open 3004 "http://localhost:3004" &

wait