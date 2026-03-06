#!/bin/bash

# scripts/secrets/sync-from-zshrc.sh
# Extracts relevant secrets from ~/.zshrc and populates .env.local
# This allows local deployment scripts to inherit your shell's configuration.

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ZSHRC="$HOME/.zshrc"
ENV_FILE=".env.local"

if [ ! -f "$ZSHRC" ]; then
    echo -e "${YELLOW}⚠️  ~/.zshrc not found. Skipping secret sync.${NC}"
    exit 0
fi

echo -e "🔍 Scanning ~/.zshrc for known secrets..."

# List of keys to look for
KEYS=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "OPENROUTER_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "N8N_API_KEY"
    "N8N_ENCRYPTION_KEY"
    "GITHUB_TOKEN"
    "NPM_TOKEN"
)

# Ensure .env.local exists
touch "$ENV_FILE"

SYNCED_COUNT=0

for KEY in "${KEYS[@]}"; do
    # Extract value: look for export KEY=... or export KEY="..."
    # We use grep to find the line, then extract the value part.
    LINE=$(grep "^export $KEY=" "$ZSHRC" | tail -n 1)
    
    if [ -n "$LINE" ]; then
        # Remove 'export KEY='
        VALUE=${LINE#*=}
        # Remove surrounding quotes if present
        VALUE=$(echo "$VALUE" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        if [ -n "$VALUE" ]; then
            # Remove existing key from .env.local to avoid duplicates
            grep -v "^$KEY=" "$ENV_FILE" > "${ENV_FILE}.tmp"
            # Append new key-value pair
            echo "$KEY=$VALUE" >> "${ENV_FILE}.tmp"
            mv "${ENV_FILE}.tmp" "$ENV_FILE"
            ((SYNCED_COUNT++))
        fi
    fi
done

if ! grep -q "^AWS_REGION=" "$ENV_FILE"; then
    AWS_CLI_REGION=$(aws configure get region 2>/dev/null)
    if [ -n "$AWS_CLI_REGION" ]; then
        echo "AWS_REGION=$AWS_CLI_REGION" >> "$ENV_FILE"
        echo "   -> Inferred AWS_REGION from AWS CLI config."
        ((SYNCED_COUNT++))
    fi
fi

echo -e "${GREEN}✅ Synced $SYNCED_COUNT secrets to $ENV_FILE${NC}"