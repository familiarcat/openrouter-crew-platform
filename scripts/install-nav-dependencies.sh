#!/bin/bash

# Install dependencies for Universal Navigation
# Target: Shared UI Components & Unified Dashboard

pnpm --filter "@openrouter-crew/shared-ui-components" add lucide-react
pnpm --filter "unified-dashboard" add lucide-react